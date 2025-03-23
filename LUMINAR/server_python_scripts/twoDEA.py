import numpy as np
import pandas as pd
from scipy.stats import norm
from statsmodels.stats.multitest import multipletests
from scipy.sparse import csr_matrix
import matplotlib.pyplot as plt
from scipy.stats import gaussian_kde
from io import BytesIO
import base64
import_paths = [
    "app.network_data.",
    "network_data.",
    ".",
    ""
]

model_imported = False
for import_path in import_paths:
    try:
        exec(f"from {import_path}node import *")
        exec(f"from {import_path}basic_functions import decoupler")
        model_imported = True
        break
    except ImportError as e:
        print(f"Failed to import from {import_path}: {e}")
        
class TwoDEA:
    def __init__(self, data):
        """
        Initialize the TwoDEA class with a given model.

        Parameters:
        -----------
        model : object
            Model object that provides `map_dataframe` and `get_influence_scores`.
        pvalue_threshold : float, optional
            Threshold for p-value filtering. Default is 0.05.
        downstream : bool, optional
            Whether to use downstream influence scores. Default is True.
        """
        self.data = data
        self.model = data.model
        self.has_pvalues = data.has_pvalues

        self.value_columns = data.value_columns
        self.pvalue_columns = data.pvalue_columns if data.has_pvalues else [col + "_pvalue" for col in data.value_columns]
        self.data_columns = data.data_columns if data.has_pvalues else [j for i in zip(self.value_columns, self.pvalue_columns) for j in i]

        self.s_df = None
        self.w_df = None

        self.modulators = {}
        self.es_df = None
        self.level_df = None
        self.es_perm_sparse = None
        self.level_perm_sparse = None
        self.node_names = None
        self.sample_names = None
        self.n_nodes = None
        self.n_samples = None

        self.enriched_nodes = set()
        
        # Store observed scores before normalization
        self.es_observed_raw = None
        self.level_observed_raw = None

    def fit(self, pvalue_threshold=0.05, map_tf=False, tf_pvalue=0.05, seed=42, downstream=True):
        """
        Fit the TwoDEA model using provided data with optimized performance.
        """
        df = self.data.get_df(pvalue_threshold=pvalue_threshold, include_pvalues=False)

        np.random.seed(seed)

        if map_tf:
            df = decoupler(df, tf_pvalue=tf_pvalue)

        # Map dataframe and get influence scores
        S_df = self.model.map_dataframe(df, delete=False)
        S_df = S_df.T

        # Get influence scores - this is a major bottleneck
        # Use a more efficient approach based on the profile
        if downstream:
            influence_scores = self.model.get_influence_scores(downstream=downstream)
            W_df = pd.DataFrame.from_dict(influence_scores, orient='index').fillna(0)
        else:
            # Use attribute checks instead of isinstance
            nodes_to_use = [node for node in S_df.columns if hasattr(node, 'index') and hasattr(node, 'hash')]
            influence_scores = self.model.get_influence_scores(
                nodes=nodes_to_use,
                downstream=downstream
            )
            W_df = pd.DataFrame.from_dict(influence_scores, orient='index').fillna(0).T

        self.enriched_nodes = set(influence_scores.keys())
        # Align W_df and S_df to have the same columns (genes)
        # Use sets for faster union operation
        all_genes = set(W_df.columns).union(set(S_df.columns)).union(set(self.model.nodes))
        all_genes = list(all_genes)  # Convert back to list for reindex
        
        # Reindex in one operation each
        W_df = W_df.reindex(columns=all_genes, fill_value=0)
        S_df = S_df.reindex(columns=all_genes, fill_value=0)
        
        # Pre-convert DataFrames to NumPy arrays and cache labels
        S_arr = S_df.to_numpy().astype(np.float32)  # shape: (n_samples, n_genes)
        W_arr = W_df.to_numpy().astype(np.float32)  # shape: (n_nodes, n_genes)
        sample_names = S_df.index.to_numpy()
        node_names = W_df.index.to_numpy()
        gene_names = S_df.columns.to_numpy()

        # Build modulators dictionary more efficiently
        modulators = {}
        
        # Pre-compute nonzero masks for all samples and nodes at once
        # This avoids repeated computations
        S_nonzero = S_arr != 0  # shape: (n_samples, n_genes)
        W_nonzero = W_arr != 0  # shape: (n_nodes, n_genes)
        
        # Iterate over samples
        for i, sample in enumerate(sample_names):
            s_row = S_arr[i]
            s_nonzero = S_nonzero[i]
            sample_dict = {}
            
            # Iterate over nodes
            for j, node in enumerate(node_names):
                w_row = W_arr[j]
                w_nonzero = W_nonzero[j]
                
                # Boolean mask for genes where both s_row and w_row are nonzero
                # Use pre-computed nonzero masks
                mask = s_nonzero & w_nonzero
                
                if np.any(mask):
                    # Retrieve indices where condition holds
                    indices = np.nonzero(mask)[0]
                    
                    # Build inner dictionary efficiently
                    node_dict = {}
                    for k in indices:
                        node_dict[gene_names[k]] = {'S': s_row[k], 'W': w_row[k]}
                    
                    sample_dict[node] = node_dict
            
            if sample_dict:  # Only add if not empty
                modulators[sample] = sample_dict
        
        self.modulators = modulators

        # Identify non-zero genes in W more efficiently
        non_zero_genes_mask = np.any(W_arr != 0, axis=0)
        non_zero_genes_indices = np.nonzero(non_zero_genes_mask)[0]
        n_non_zero_genes = len(non_zero_genes_indices)

        # Extract non-zero portions of arrays and convert to float32
        W_non_zero = W_arr[:, non_zero_genes_indices].astype(np.float32)
        S_non_zero = S_arr[:, non_zero_genes_indices].astype(np.float32)
        
        # Use contiguous arrays for better performance
        W_non_zero = np.ascontiguousarray(W_non_zero)
        S_non_zero = np.ascontiguousarray(S_non_zero)

        # Reshape for broadcasting
        W_3d = W_non_zero[:, np.newaxis, :]  # (n_nodes, 1, n_non_zero_genes)
        S_3d = S_non_zero[np.newaxis, :, :]  # (1, n_samples, n_non_zero_genes)
        
        # Compute element-wise product
        w_s = W_3d * S_3d  # (n_nodes, n_samples, n_non_zero_genes)

        # Compute observed enrichment scores
        # Use optimized NumPy operations
        N = np.sum(np.abs(w_s) * w_s, axis=2)
        D = 2 + np.sum((W_3d**2) * (S_3d**2), axis=2)
        es_observed = N / D  # (n_nodes, n_samples)
        level_observed = np.sum(w_s, axis=2)

        # Permutation testing - use fewer permutations for better performance
        n_permutations = 1000  # Reduced from 250 to improve performance
        n_nodes = W_arr.shape[0]
        n_genes = W_arr.shape[1]
        n_samples = S_arr.shape[0]

        # Generate permutation indices using a list comprehension
        permuted_indices_array = np.array(
            [np.random.permutation(n_genes)[non_zero_genes_indices] for _ in range(n_permutations)],
            dtype=np.int32
        )

        # Use np.take_along_axis to vectorize the permutation of S_arr:
        # S_arr has shape (n_samples, n_genes) and we want to select columns per permutation.
        S_perm = np.take_along_axis(S_arr[np.newaxis, :, :], permuted_indices_array[:, np.newaxis, :], axis=2)

        # Compute permuted enrichment scores efficiently
        # Use a more memory-efficient approach
        W_reshaped = W_non_zero.reshape(1, n_nodes, 1, n_non_zero_genes)
        
        # Process permutations in batches to reduce memory usage
        batch_size = 100  # Process 100 permutations at a time
        es_perm = np.zeros((n_permutations, n_nodes, n_samples), dtype=np.float32)
        level_perm = np.zeros((n_permutations, n_nodes, n_samples), dtype=np.float32)
        
        for batch_start in range(0, n_permutations, batch_size):
            batch_end = min(batch_start + batch_size, n_permutations)
            batch_size_actual = batch_end - batch_start
            
            # Process this batch
            S_batch = S_perm[batch_start:batch_end]
            S_batch_reshaped = S_batch.reshape(batch_size_actual, 1, n_samples, n_non_zero_genes)
            
            # Compute element-wise product for this batch
            w_s_batch = W_reshaped * S_batch_reshaped
            
            # Compute N_perm and D_perm for this batch
            N_batch = np.sum(np.abs(w_s_batch) * w_s_batch, axis=3)
            D_batch = 2 + np.sum((W_reshaped**2) * (S_batch_reshaped**2), axis=3)
            
            # Store results for this batch
            es_perm[batch_start:batch_end] = N_batch / D_batch
            level_perm[batch_start:batch_end] = np.sum(w_s_batch, axis=3)
            
            # Free memory
            del w_s_batch, N_batch, D_batch, S_batch, S_batch_reshaped

        # Calculate statistics
        es_mean = np.mean(es_perm, axis=0)
        es_std = np.std(es_perm, axis=0, ddof=0)
        es_zero_std_mask = (es_std != 0)
        
        # Pre-allocate arrays
        z_scores = np.zeros_like(es_mean)
        es_p_values = np.ones_like(es_mean)
        
        # Calculate z-scores and p-values only where std > 0
        z_scores[es_zero_std_mask] = (es_observed[es_zero_std_mask] - es_mean[es_zero_std_mask]) / es_std[es_zero_std_mask]
        es_p_values[es_zero_std_mask] = norm.sf(np.abs(z_scores[es_zero_std_mask]))

        # Same for level scores
        level_mean = np.mean(level_perm, axis=0)
        level_std = np.std(level_perm, axis=0, ddof=0)
        level_zero_std_mask = (level_std != 0)
        
        # Pre-allocate arrays
        level_z_scores = np.zeros_like(level_mean)
        level_p_values = np.ones_like(level_mean)
        
        # Calculate z-scores and p-values only where std > 0
        level_z_scores[level_zero_std_mask] = (level_observed[level_zero_std_mask] - level_mean[level_zero_std_mask]) / level_std[level_zero_std_mask]
        level_p_values[level_zero_std_mask] = norm.sf(np.abs(level_z_scores[level_zero_std_mask]))

        # FDR correction
        es_pvals_flat = es_p_values.flatten()
        _, es_pvals_corrected, _, _ = multipletests(es_pvals_flat, method='fdr_bh')
        es_p_values_fdr = es_pvals_corrected.reshape(es_p_values.shape)

        level_pvals_flat = level_p_values.flatten()
        _, level_pvals_corrected, _, _ = multipletests(level_pvals_flat, method='fdr_bh')
        level_p_values_fdr = level_pvals_corrected.reshape(level_p_values.shape)

        # Construct DataFrames more efficiently
        # Pre-allocate arrays for data
        es_data = np.zeros((n_nodes, 2 * n_samples))
        lvl_data = np.zeros((n_nodes, 2 * n_samples))
        
        # Fill arrays
        for sample_idx in range(n_samples):
            es_data[:, 2 * sample_idx] = es_observed[:, sample_idx]
            es_data[:, 2 * sample_idx + 1] = es_p_values_fdr[:, sample_idx]
            
            lvl_data[:, 2 * sample_idx] = level_observed[:, sample_idx]
            lvl_data[:, 2 * sample_idx + 1] = level_p_values_fdr[:, sample_idx]
        
        # Create column names
        es_columns = self.data_columns        
        lvl_columns = self.data_columns

        # Create DataFrames
        es_df = pd.DataFrame(es_data, index=node_names, columns=es_columns)
        level_df = pd.DataFrame(lvl_data, index=node_names, columns=lvl_columns)

        # Store results
        self.S_df = None
        self.W_df = None
        
        self.es_df = es_df
        self.level_df = level_df
        self.node_names = node_names
        self.sample_names = sample_names
        self.n_nodes = n_nodes
        self.n_samples = n_samples
        
        # Store permutations as sparse matrices
        # Reshape permutation arrays
        es_perm_2d = es_perm.reshape(n_permutations, -1)
        level_perm_2d = level_perm.reshape(n_permutations, -1)
        
        # Convert to sparse matrices
        self.es_perm_sparse = csr_matrix(es_perm_2d)
        self.level_perm_sparse = csr_matrix(level_perm_2d)
        
        # Store the raw observed scores
        self.es_observed_raw = es_observed
        self.level_observed_raw = level_observed

    def get_df(self, include_pvalues=True, threshold=None, normalize=True, names=False, values="es", pvalue_from="both", decimals=None, use_entity=False):
        """
        Return the DataFrame with optional removal of p-values, thresholding, and normalization.

        Parameters:
        -----------
        include_pvalues : bool, optional
            Whether to return p-value columns.
        threshold : float, optional
            If provided, sets values to 0 when their p-value > threshold.
        normalize : bool, optional
            Whether to normalize the values by the per-node absolute max.
        names : bool, optional
            Whether to use full node names in index.
        values : str, optional
            Which values to return ("es" or "level").
        pvalue_from : str, optional
            Which p-values to use for thresholding ("es", "level", or "both"). If "both", uses the minimum p-value.
        decimals : int, optional
            Number of decimal places to round to. If None, no rounding is performed.
        use_entity : bool, optional
            Whether to use node.entity as index. For multiple nodes with same entity, uses max for values and min for p-values.

        Returns:
        --------
        pd.DataFrame
            The DataFrame processed according to the parameters.
        """
        # Select the dataframe based on values parameter
        df = self.es_df if values == "es" else self.level_df

        if df is None:
            raise RuntimeError("Model has not been fit yet.")
        
        df = df.copy()

        # Normalize by absolute max per node from the raw observed scores
        lvl_normalized = df[self.value_columns].values
        # Normalize if requested
        if normalize:
            lvl_max_vals = np.max(np.abs(lvl_normalized), axis=1, keepdims=True)
            lvl_max_vals[lvl_max_vals == 0] = 1
            lvl_normalized = lvl_normalized / lvl_max_vals
        else:
            lvl_max_vals = np.max(np.max(np.abs(lvl_normalized), axis=1, keepdims=True))
            lvl_normalized = lvl_normalized / lvl_max_vals
        
        df[self.value_columns] = lvl_normalized

        # If threshold is set, set values with p-value above threshold to 0
        if self.pvalue_columns and threshold is not None:
            if pvalue_from == "both" and self.es_df is not None and self.level_df is not None:
                # Use minimum p-values from both es and level dataframes
                es_pvalues = self.es_df[self.pvalue_columns]
                level_pvalues = self.level_df[self.pvalue_columns]
                
                # Get minimum p-values
                min_pvalues = pd.DataFrame(np.minimum(es_pvalues.values, level_pvalues.values),
                                          index=es_pvalues.index,
                                          columns=es_pvalues.columns)
                
                # Create boolean mask for thresholding
                mask = min_pvalues > threshold
            else:
                # Use p-values from the specified source
                pvalue_df = self.es_df if pvalue_from == "es" else self.level_df
                
                # Create boolean mask for thresholding
                mask = pvalue_df[self.pvalue_columns] > threshold
            
            # Zero out values using vectorized operations
            df[self.value_columns] = df[self.value_columns].where(~mask.values, 0)

        if use_entity:
            # Create mapping of entity names to entity objects and nodes
            entity_dict = {}
            for node in df.index:
                entity = node.entity
                entity_name = entity.name  # or some other unique identifier
                if entity_name not in entity_dict:
                    entity_dict[entity_name] = {'entity': entity, 'nodes': []}
                entity_dict[entity_name]['nodes'].append(node)

            # Create temporary index for grouping
            df['_entity_name'] = [node.entity.name for node in df.index]
            
            # Group by entity name with different aggregation for values and p-values
            agg_dict = {}
            for col in df.columns:
                if col == '_entity_name':
                    continue
                if col in self.value_columns:
                    agg_dict[col] = 'max'  # Use max for value columns
                else:
                    agg_dict[col] = 'min'  # Use min for p-value columns
            
            df = df.groupby('_entity_name').agg(agg_dict)
            
            # Restore entity objects as index
            df.index = [entity_dict[name]['entity'] for name in df.index]

            # df.drop(columns=['_entity_name'], inplace=True)

        if names:
            df.rename(index={node:node.fullname for node in df.index}, inplace=True)

        if not include_pvalues:
            # Keep only the data columns, excluding p-value columns
            df = df[self.value_columns]

        # Round decimals if specified
        if decimals is not None:
            df = df.round(decimals)

        return df

    def plot_histogram(self, enriched_node, sample_name, score="es", bins=30, return_image=False):
        """
        Plot a histogram of the permutation distribution of ES or Level score for a specific node and sample,
        along with a fitted distribution curve (KDE).
    
        Parameters:
        -----------
        enriched_node : str or node object
            The node of interest.
        sample_name : str
            The sample name.
        score : str, optional
            Either "es" or "level" to specify which score's distribution to plot.
        bins : int, optional
            Number of bins for the histogram.
        return_image : bool, optional
            Whether to return the figure as a base64 encoded image.
            
        Returns:
        --------
        str or None
            If return_image is True, returns a base64 encoded string of the image.
            Otherwise, displays the plot and returns None.
        """

        if (self.es_df is None) or (self.level_df is None):
            raise RuntimeError("Model has not been fit yet.")
    
        if score == "es":
            df = self.es_df
            perm_sparse = self.es_perm_sparse
        else:
            df = self.level_df
            perm_sparse = self.level_perm_sparse

            
        pval_col = self.pvalue_columns[self.value_columns.index(sample_name)]
        
        if isinstance(enriched_node,str):
            enriched_nodes = self.model.get_nodes_from_name(enriched_node)
            if len(enriched_nodes) > 0:
                enriched_nodes = sorted(enriched_nodes, key = lambda node: abs(df.loc[node, pval_col]))
                enriched_node = list(enriched_nodes)[0]                                       
            else:
                raise RuntimeError("No  node with name " + enriched_node + " has been found.")
    
        # Find indices
        if enriched_node not in df.index:
            raise ValueError(f"Node {enriched_node} not found in DataFrame.")
        if sample_name not in self.sample_names:
            raise ValueError(f"Sample {sample_name} not found in DataFrame.")
    
        sample_col_idx = list(df.columns).index(sample_name)
        node_idx = list(df.index).index(enriched_node)
    
        observed_score = df.loc[enriched_node, sample_name]
        observed_pval = df.loc[enriched_node, pval_col] if pval_col in df.columns else np.nan
    
        # Flattened index: node_idx * n_samples + sample_idx
        sample_idx = list(self.sample_names).index(sample_name)
        flattened_index = node_idx * self.n_samples + sample_idx
    
        # Extract the distribution of permutations for this node-sample pair
        perm_distribution = perm_sparse[:, flattened_index].toarray().flatten()
    
        plt.rcParams['font.size'] = 12
        fig = plt.figure(figsize=(8, 6))
        
        # Plot the histogram
        counts, bin_edges, _ = plt.hist(
            perm_distribution, bins=bins, alpha=0.7, color='skyblue', edgecolor='black', density=False
        )
        
        # Add a vertical line for the observed score
        plt.axvline(
            x=observed_score, color='red', linestyle='dashed', linewidth=2,
            label=f'Observed = {observed_score:.2f} (pvalue: {observed_pval:.2e})'
        )
    
        # Fit a density curve (KDE)
        density = gaussian_kde(perm_distribution)
        xs = np.linspace(min(perm_distribution), max(perm_distribution), 200)
    
        # Convert density to comparable scale with histogram counts
        # density(xs) gives probability density; multiply by total count and bin width to scale
        total_count = len(perm_distribution)
        bin_width = (bin_edges[-1] - bin_edges[0]) / bins
        plt.plot(xs, density(xs)*total_count*bin_width, 'k-', linewidth=2, label='KDE Fit')
    
        plt.xlabel('Score')
        plt.ylabel('Frequency')
        plt.title(f'Permutation Distribution of {score} for {enriched_node.fullname} in {sample_name}')
        plt.legend(fontsize=8, loc="upper left")
        plt.tight_layout()
        
        if return_image:
            buf = BytesIO()
            plt.savefig(buf, format='png', dpi=300, bbox_inches='tight')
            buf.seek(0)
            img_str = base64.b64encode(buf.getvalue()).decode('utf-8')
            plt.close(fig)
            return img_str
        else:
            plt.show()
            return None
        
    def circle_plot(self, save_file_name="", figsize=(24,12), fontsize=18.0, normalize=True, threshold=1, unique=False, filter_samples=lambda x: True, return_image=False, adjust_samples=lambda x: x, top_n=None, full_names=False, use_entity=False, score="level"):
        """
        Generate a circular plot visualization of the dataset.
        
        Parameters:
        -----------
        save_file_name : str, optional
            File name to save the plot. If empty, the plot is not saved.
        figsize : tuple, optional
            Figure size (width, height) in inches.
        fontsize : float, optional
            Font size for text elements.
        significant : bool, optional
            Whether to only show significant values.
        unique : bool, optional
            Whether to show only unique values.
        filter_samples : function, optional
            Function to filter samples.
        return_image : bool, optional
            Whether to return the figure as a base64 encoded image.
        
        Returns:
        --------
        str or None
            If return_image is True, returns a base64 encoded string of the image.
            Otherwise, displays the plot and returns None.
        """
        import numpy as np
        from io import BytesIO
        import base64
        import matplotlib.pyplot as plt
        import pandas as pd

        # Get the data; we keep the DataFrame index intact.
        data = self.get_df(include_pvalues=True, values=score, threshold=None, normalize=normalize, use_entity=use_entity)
        plt.rcParams['font.size'] = fontsize

        # Exclude columns ending with '_pvalue'
        samples = self.value_columns
        if filter_samples:
            samples = [sample for sample in samples if filter_samples(sample)]
        print(samples)
       

        fig, ax = plt.subplots(figsize=figsize)
        size = 0.2
        innersize = 0.4
        startangle = 130

        def rgb2hex(r, g, b):
            return "#{:02x}{:02x}{:02x}".format(r, g, b)

        def getcolorfromvalue(v):
            if v == 0:
                return "#ffffff"  # White for zero values
            if v < 0:
                v = max(-1, v)  # Clamp to -1
                v = 1 - abs(v)  # Scale from -1 to 0 -> 0 to 1
                return rgb2hex(int(255 * v), int(255 * v), 255)
            else:
                v = min(1, v)  # Clamp to 1
                v = 1 - v  # Scale from 0 to 1 -> 1 to 0
                return rgb2hex(255, int(255 * v), int(255 * v))

        # If top_n is specified, get the significant data and select top nodes
        if top_n is not None and top_n > 0:
            # Get only significant values
            significant_data = self.get_df(include_pvalues=False, threshold=0.05, normalize=normalize, values="es", pvalue_from="es", use_entity=use_entity)
            
            # Filter to include only the specified samples
            significant_data = significant_data[samples]
            
            # Calculate absolute sums across all samples for each node
            abs_sums = significant_data.abs().sum(axis=1).to_dict()
            
            # Sort nodes by absolute sum and take the top n
            top_nodes = sorted(abs_sums.keys(), key=lambda x: abs_sums[x], reverse=True)[:top_n]
            
            # Filter the data to include only the top nodes
            data = data.loc[top_nodes]

        # Save the original index objects and extract their names for display
        nodes = list(data.index)
        pnames = [node.fullname if full_names else node.name for node in nodes]

        ax.pie([len(pnames)], radius=innersize, colors=["#fafafa"])

        # Helper function to extract a scalar value if a Series is returned
        def get_scalar(val):
            if hasattr(val, 'iloc'):
                return val.iloc[0]
            return val

        # Build the colored wedges for each sample
        for i, header in enumerate(samples):
            colors = []
            for node in nodes:
                # Get the pvalue and ensure it's a scalar
                pvalue_val = get_scalar(data.loc[node, self.pvalue_columns[i]])
                # If the condition is met, use the header value; otherwise, use 0
                if float(pvalue_val) <= threshold:
                    val = get_scalar(data.loc[node, header])
                    colors.append(val)
                else:
                    colors.append(0)
            colors = [getcolorfromvalue(x) for x in colors]
            wedges, _ = ax.pie(
                [1 for _ in colors],
                radius=(innersize + size * (i + 1)),
                labels=["" for _ in colors],
                startangle=startangle,
                colors=colors,
                counterclock=False,
                wedgeprops=dict(width=size, edgecolor='w')
            )

        # Add significance markers on the chart
        for i, header in enumerate(samples):
            for j, node in enumerate(nodes):
                pvalue_val = get_scalar(data.loc[node, self.pvalue_columns[i]])
                if float(pvalue_val) <= 0.05:
                    # Compute the midpoint angle of the wedge
                    mid_angle_deg = (wedges[j].theta1 + wedges[j].theta2 + 8.5) / 2
                    mid_angle_rad = np.deg2rad(mid_angle_deg-2.5)
                    outer_radius = innersize + size * (i + 1)
                    text_offset = 0.04  # Adjust as needed
                    x = (outer_radius - text_offset) * np.cos(mid_angle_rad)
                    y = (outer_radius - text_offset) * np.sin(mid_angle_rad)
                    # Determine text color based on the header value
                    val = get_scalar(data.loc[node, header])
                    text_color = 'white' if val < -0.5 else 'black'
                    ax.text(x, y, '*', ha='center', va='center', fontsize=14, color=text_color, weight='bold')

        # Calculate cumulative angles for labeling
        cumulative_angles = np.linspace(startangle, startangle + 360, len(pnames) + 1)[:-1]
        label_radius = innersize + 0.0

        for i, label in enumerate(pnames[::-1]):
            angle_rad = np.deg2rad(cumulative_angles[i] + 2.5)
            x = label_radius * np.cos(angle_rad)
            y = label_radius * np.sin(angle_rad)
            t = ax.text(
                x, y,
                label.replace("Synthesis", "Synth.").replace("Response", "Resp.").replace("Migration", "Migr."),
                ha='left', va='center', fontsize=13,
                rotation=np.rad2deg(angle_rad),
                rotation_mode='anchor'
            )
            t.set_bbox(dict(facecolor='#FFFFFF', alpha=0.5, edgecolor="#FFFFFF00", pad=0.07))
            
        # Add sample names to the side of the plot
        # Calculate the rightmost point of the outermost circle
        max_radius = innersize + size * len(samples)
        label_x_position = max_radius + 0.2  # Fixed x position for all labels
        
        # Calculate vertical spacing for the labels - make it smaller to bring labels closer together
        vertical_spacing = 0.15  # Reduced from 0.3 to bring labels closer together
        
        # Position all labels in the upper half of the circle
        # Start from a positive y position (upper half)
        start_y = 0.5  # Start in the upper half
        
        # Store the maximum x and y coordinates to adjust axis limits later
        max_x_coord = label_x_position
        max_y_coord = start_y
        
        for i, sample in enumerate(samples):
            # Calculate the layer radius
            layer_radius = innersize + size * (i + 1)
            
            # Calculate vertical position for this label - all in the upper half
            label_y = start_y - i * vertical_spacing
            
            # Add the sample name text with high z-order
            sample_text = ax.text(
                label_x_position,  # Fixed x position for all labels
                label_y,           # Vertically spaced position in upper half
                adjust_samples(sample),
                ha='left',         # Left-aligned text
                va='center',       # Vertically centered
                fontsize=12,
                zorder=999         # High z-order to ensure it's drawn on top
            )
            
            # Draw a connecting line with a small marker (high z-order)
            layer_x = layer_radius  # Rightmost point of this layer
            layer_y = 0             # At angle 0, y is always 0
            
            # Draw a connecting line with a small marker and high z-order
            ax.plot([layer_x, label_x_position], [layer_y, label_y], 'k-', 
                   linewidth=0.7, alpha=0.5, zorder=999)  # High z-order for the line
            ax.plot(layer_x, layer_y, 'ko', markersize=3, alpha=0.7, zorder=999)  # High z-order for the marker
            
            # Update max_y_coord if needed
            max_y_coord = max(max_y_coord, label_y)
        
        # Adjust axis limits to ensure all elements are visible
        # Get current limits
        x_min, x_max = ax.get_xlim()
        y_min, y_max = ax.get_ylim()
        
        # Ensure the limits include all our elements with some padding
        padding = 0.1
        new_x_max = max(x_max, label_x_position + padding)
        new_y_max = max(y_max, max_y_coord + padding)
        
        # Set the new limits
        ax.set_xlim(x_min, new_x_max)
        ax.set_ylim(y_min, new_y_max)
        
        # Make sure the aspect ratio is equal so the circle looks like a circle
        ax.set_aspect('equal')

        if save_file_name:
            plt.savefig(
                save_file_name + ("_unique" if unique else "") + ".png",
                dpi=300, bbox_inches='tight'
            )

        if return_image:
            buf = BytesIO()
            plt.savefig(buf, format='png', dpi=300, bbox_inches='tight')
            buf.seek(0)
            img_str = base64.b64encode(buf.getvalue()).decode('utf-8')
            plt.close(fig)
            return img_str
        else:
            plt.show()
            return None

    def get_enrichment_scores(self, pvalue_threshold=0.05, as_list=False):
        """Returns a dictionary of the enrichment scores for each sample."""

        data = self.get_df(include_pvalues=False, threshold=pvalue_threshold, normalize=True, names = False, decimals=3)

        minerva_boxes = []
        for node in data.index:        
            for minerva_box in node.get_minerva_box():
                minerva_box["value"] = data.loc[node].tolist()
                if as_list:
                    minerva_boxes.append(list(minerva_box.values()))
                else:
                    minerva_boxes.append(minerva_box)

        return minerva_boxes
    def plot_modulator_impact(self, n_top=10, save_file_name=None, return_image=False, style='scientific', sample_number=False):
        """
        Generate a chart showing the combined absolute impact of the top modulators across samples.
        Uses pre-calculated modulator impacts from self.modulators.
        
        Parameters:
        -----------
        n_top : int, optional
            Number of top modulators to show (default 10)
        save_file_name : str, optional
            If provided, saves the plot to this filename
        return_image : bool, optional
            If True, returns the plot as a base64 encoded string
        style : str, optional
            Plot style ('scientific' or 'default')
            
        Returns:
        --------
        str or None
            Base64 encoded image string if return_image=True, None otherwise
        """
        if not self.modulators:
            raise ValueError("Model must be fitted before plotting modulator impact")
            
        # Get total impact for each modulator, only considering enriched phenotypes
        total_impacts = defaultdict(float)
        sample_impacts = {}
        enriched_df = self.get_df(include_pvalues=False, threshold=0.05, normalize=True, names=False)

        for sample in self.sample_names:
            phenotype_impacts = self.modulators.get(sample, {})
            sample_impacts[sample] = defaultdict(float)
            sample_total = 0
            enriched_nodes = enriched_df[enriched_df[sample] != 0].index
            for phenotype in enriched_nodes:
                if phenotype in phenotype_impacts:
                    phenotype_impacts_dict = phenotype_impacts[phenotype]
                    for node, scores in phenotype_impacts_dict.items():
                        impact = abs(scores['S'] * scores['W'])
                        sample_total += impact
                        total_impacts[node.entity] += impact
                        sample_impacts[sample][node.entity] += impact
        
        # Get top n modulators
        top_modulators = sorted(total_impacts.items(), key=lambda x: x[1], reverse=True)[:n_top]
        top_modulator_names = [m[0] for m in top_modulators]
        
        # Calculate impact scores for each sample
        df = pd.DataFrame(index=self.sample_names, columns=top_modulator_names)
        for modulator in top_modulator_names:
            df[modulator] = [sample_impacts[sample][modulator] for sample in self.sample_names]

        # Convert modulator node objects to their names in the DataFrame index
        df.columns = [modulator.name for modulator in df.columns]
        
        # Create ranked labels for the legend
        ranked_labels = [f"{i+1}. {modulator}" for i, modulator in enumerate(df.columns)]
        
        # Create a mapping from column name to ranked label
        col_to_ranked_label = {col: label for col, label in zip(df.columns, ranked_labels)}

        # Set scientific style if requested
        if style == 'scientific':
            # Use a clean style
            plt.style.use('default')
            
            # Create the plot with improved aesthetics
            fig, ax = plt.subplots(figsize=(10, 8), dpi=150, facecolor='white')
            
            # Use tab10 color palette with muted colors
            base_colors = plt.cm.tab10(np.arange(10))
            # Create muted versions of the colors
            muted_colors = base_colors.copy()
            # Adjust saturation by mixing with gray
            gray_level = 0.3
            for i in range(len(muted_colors)):
                r, g, b, a = muted_colors[i]
                muted_colors[i, 0] = r * (1 - gray_level) + gray_level
                muted_colors[i, 1] = g * (1 - gray_level) + gray_level
                muted_colors[i, 2] = b * (1 - gray_level) + gray_level
            
            # Repeat colors if needed
            colors = np.vstack([muted_colors] * (len(df.columns) // 10 + 1))[:len(df.columns)]
            
            # Create a list to store line objects for the legend
            lines = []
            
            # Plot lines with points for each modulator
            for idx, modulator in enumerate(df.columns):
                # Get the color with transparency for the line
                line_color = colors[idx].copy()
                line_color[3] = 0.6  # Set alpha to 0.6 for transparency
                
                # Plot line with increased width and transparency
                line = ax.plot(range(len(df)), df[modulator].values,
                       color=line_color, linewidth=3.0, zorder=1)[0]
                
                # Store the line object for the legend
                lines.append(line)
                
                # Plot points with white border (no transparency)
                ax.scatter(range(len(df)), df[modulator].values,
                          s=80, color=colors[idx], 
                          edgecolor='white', linewidth=1.5, zorder=2)
                
            # Customize the plot with more scientific appearance
            ax.set_title('Ranked Impact of Modulators on the Enrichment across samples', fontsize=14, pad=20)
            ax.set_xlabel('Samples', fontsize=12)
            ax.set_ylabel('Total Absolute Impact (Σ|w x s|)', fontsize=12)
            
            # Set x-axis ticks and labels
            ax.set_xticks(range(len(df)))
            if sample_number:
                ax.set_xticklabels(range(1,len(df)+1), rotation=0, ha='center')
            else:
                ax.set_xticklabels(df.index, rotation=45, ha='right', fontsize=10)
            
            # Format y-axis with scientific notation if values are small
            if df.values.max() < 0.01:
                ax.ticklabel_format(style='sci', axis='y', scilimits=(0,0))
            
            # Add grid lines for better readability
            ax.grid(True, linestyle='-', alpha=0.2)
            ax.grid(True, linestyle=':', alpha=0.1, which='minor')
            ax.minorticks_on()
            
            # Add legend with ranked labels
            legend = ax.legend(lines, ranked_labels,  loc='upper left',
                            #   bbox_to_anchor=(1.02, 1),
                              fontsize=9, frameon=True, fancybox=False, 
                              edgecolor='black', framealpha=0.8)
            legend.get_frame().set_linewidth(0.5)
            
            # Add a light box around the plot area
            for spine in ax.spines.values():
                spine.set_visible(True)
                spine.set_linewidth(0.5)
                spine.set_color('black')
            
            # Add subtle background shading for alternating samples
            for i in range(0, len(df), 2):
                ax.axvspan(i-0.5, i+0.5, color='gray', alpha=0.05)
        else:
            # Create the plot with default styling
            fig, ax = plt.subplots(figsize=(12, 8))
            
            # Plot lines with points for each modulator using tab20 color palette
            colors = plt.cm.tab20(np.linspace(0, 1, len(df.columns)))
            lines = []
            
            for idx, modulator in enumerate(df.columns):
                line = ax.plot(range(len(df)), df[modulator].values,
                       color=colors[idx], linewidth=2, marker='o', markersize=8)[0]
                lines.append(line)
                
            # Customize the plot
            ax.set_title('Ranked Impact of Modulators on the enrichment across samples', fontsize=14, pad=20)
            ax.set_xlabel('Samples', fontsize=12)
            ax.set_ylabel('Total Absolute Impact (Σ|w*s|)', fontsize=12)
            
            # Set x-axis ticks and labels
            ax.set_xticks(range(len(df)))
            ax.set_xticklabels(range(1,len(df)+1) if sample_number else df.index, rotation=45, ha='right')
            
            # Add legend with ranked labels
            ax.legend(lines, ranked_labels, 
                     bbox_to_anchor=(1.05, 1), loc='upper left', borderaxespad=0.)
            
            # Add grid for better readability
            ax.grid(True, linestyle='--', alpha=0.7)
        
        # Adjust layout to prevent label cutoff
        plt.tight_layout()
 
        if return_image:
            buf = BytesIO()
            plt.savefig(buf, format='png', dpi=300, bbox_inches='tight')
            buf.seek(0)
            img_str = base64.b64encode(buf.getvalue()).decode('utf-8')
            plt.close(fig)
            return img_str
        else:
                    
            if save_file_name:
                plt.savefig(save_file_name + ".png", dpi=300, bbox_inches='tight')
            
            plt.show()
            return None


