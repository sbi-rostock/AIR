import pandas as pd
import pandas as pd
from io import StringIO
import requests
from flask import jsonify
from uuid import uuid4


class DataMapper():
    def __init__(self, file_content, model, data_id = "", name = "", has_pvalues = False):
        self.model = model
        self.data_id = data_id
        self.name = name
        self.has_pvalues = has_pvalues

        self.read_data_file(file_content, file_type=None)
        
        self.process_data_frame()

    def detect_delimiter(self, file_content):
        """Detect whether a file is CSV or TSV by analyzing its content"""
        # Get the first few non-empty lines
        lines = [line.strip() for line in file_content.split('\n') if line.strip()]
        if not lines:
            return ','  # Default to CSV if file is empty
        
        # Count potential delimiters in the first few lines
        first_lines = lines[:min(5, len(lines))]
        comma_counts = [line.count(',') for line in first_lines]
        tab_counts = [line.count('\t') for line in first_lines]
        
        # Calculate the average count for each delimiter
        avg_commas = sum(comma_counts) / len(comma_counts)
        avg_tabs = sum(tab_counts) / len(tab_counts)
        
        # Check consistency
        comma_consistent = len(set(comma_counts)) <= 1
        tab_consistent = len(set(tab_counts)) <= 1
        
        if avg_tabs > 0 and tab_consistent:
            return '\t'  # TSV
        elif avg_commas > 0 and comma_consistent:
            return ','   # CSV
        elif avg_tabs > 0:
            return '\t'  # Default to TSV if both present but tabs exist
        else:
            return ','   # Default to CSV
    
    def read_data_file(self, file_content, file_type=None):
        """Common function to read different file types into a pandas DataFrame"""
        try:
            # Auto-detect delimiter if file_type is not specified
            if not file_type or file_type not in ['csv', 'tsv']:
                delimiter = self.detect_delimiter(file_content)
            else:
                delimiter = '\t' if file_type == 'tsv' else ','
            
            # Try both number formats and compare results
            try:
                # German format
                german_data = pd.read_csv(StringIO(file_content), 
                                        sep=delimiter, 
                                        index_col=0,
                                        thousands='.',
                                        decimal=',')
                
                # Standard format
                standard_data = pd.read_csv(StringIO(file_content), 
                                          sep=delimiter, 
                                          index_col=0)
                
                # Count NA values in numeric columns for both formats
                german_nas = german_data.select_dtypes(include=['float', 'int']).isna().sum().sum()
                standard_nas = standard_data.select_dtypes(include=['float', 'int']).isna().sum().sum()
                
                # Choose the format with fewer NAs
                self.data = german_data if german_nas < standard_nas else standard_data
                
            except:
                # If comparison fails, fall back to standard format
                self.data = pd.read_csv(StringIO(file_content), 
                                      sep=delimiter, 
                                      index_col=0)
            
            if self.data.empty:
                raise ValueError("File contains no data")
                        
            if self.has_pvalues:
                self.value_columns = [col for i,col in enumerate(self.data.columns) if i%2 == 0]
                self.pvalue_columns = [col for i,col in enumerate(self.data.columns) if i%2 == 1]
            else:
                self.value_columns = list(self.data.columns)
                self.pvalue_columns = []

            self.data_columns = list(self.data.columns)

            for col in self.pvalue_columns:
                self.data[col] = pd.to_numeric(self.data[col], errors='coerce').fillna(1)

            for col in self.value_columns:
                self.data[col] = pd.to_numeric(self.data[col], errors='coerce').fillna(0)
                
        except UnicodeDecodeError:
            raise ValueError("File must be in UTF-8 format")
        except pd.errors.EmptyDataError:
            raise ValueError("The file appears to be empty")
        except pd.errors.ParserError as e:
            raise ValueError(f"Failed to parse file: {str(e)}")
        except Exception as e:
            raise ValueError(f"Error reading file: {str(e)}")
    
    def process_data_frame(self):
        """Common function to process dataframes for both omics and fairdom data"""
        if self.model:
            self.data, self.mapped_nodes = self.model.map_dataframe_minerva(self.data, return_mapped_nodes=True)
        
        # Calculate max values only for numeric columns
        numeric_data = self.data.select_dtypes(include=['float', 'int'])
        max_val = numeric_data.abs().max().max()
        column_max = numeric_data.abs().max().to_dict()
        
        # Calculate minerva max only for mapped entries
        if 'minerva_id' in self.data.columns:
            minerva_max = self.data[self.data['minerva_id'] != 0].select_dtypes(include=['float', 'int']).abs().max().max()
        else:
            minerva_max = max_val
        
        self.data.index.name = "index"

        self.max = float(max_val) if not pd.isna(max_val) else 0
        self.minerva_max = float(minerva_max) if not pd.isna(minerva_max) else 0
        self.column_max = {k: float(v) if not pd.isna(v) else 0 for k, v in column_max.items()}

    def get_df(self, minerva_col=False, model_col=False, pvalue_threshold=None, include_pvalues=True):
        columns_to_exclude = []
        if not minerva_col:
            columns_to_exclude.append('minerva_id')
        if not model_col:
            columns_to_exclude.append('model_nodes')
            
        df = self.data.copy()   

        if columns_to_exclude:
            df = df[[col for col in df.columns if col not in columns_to_exclude]]
        
        if self.has_pvalues and pvalue_threshold is not None:
            # Create boolean mask for all p-values at once
            mask = df[self.pvalue_columns] > pvalue_threshold
            
            # Zero out values using vectorized operations
            df[self.value_columns] = df[self.value_columns].where(~mask.values, 0)
            
        if include_pvalues:
            return df
        else:
            return df[self.value_columns]

            
            
     

        return self.data
    
    def get_processed_data(self):
        df = self.get_df(minerva_col = True).reset_index()
        return {
            "columns": df.columns.tolist(),
            "data": df.values.tolist(),
            "max": self.max,
            "minerva_max": self.minerva_max,
            "column_max": self.column_max,
            "data_id": self.data_id,
        }
    
    def get_data_info(self):
        return {
            "data_id": self.data_id,
            "name": self.name,
        }
    
            
    def get_data_scores(self, pvalue_threshold=0.05, as_list=False):
        """Returns a dictionary of the enrichment scores for each sample."""

        minerva_boxes = []
        # Get data values once, excluding metadata columns
        data_values = self.data.drop(['minerva_id', 'model_nodes'], axis=1)
        
        # Vectorized operation to get all model nodes and values
        for idx, row in self.data.iterrows():
            nodes = row['model_nodes']
            if isinstance(nodes, list):
                values = data_values.loc[idx].tolist()
                for node in nodes:
                    for minerva_box in node.get_minerva_box():
                        minerva_box["value"] = values
                        if as_list:
                            minerva_boxes.append(list(minerva_box.values()))
                        else:
                            minerva_boxes.append(minerva_box)

        return minerva_boxes