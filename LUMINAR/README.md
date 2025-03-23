# Overview

This resource presents JavaScript and Python files for LUMINAR tool, which is a MINERVA plugin.

The tool has been developed in the Disease Map projects at the Department of Systems Biology and Bioinformatics at the University of Rostock and were developed by Matti van Welezen.

The Javascript files generate the UI in MINERVA while the PYthon scipts allow, independently from MINERVA, the processing and analysis of Knowledge Graphs from SBML files.

The Example_Code.ipynb in the python script folder shows how to read and analyse KG files based on SBML files in the "Example Map" folder.



# Object-oriented Structure

![image](https://github.com/MattiHoch/KnowledgeGraphAnalysis/assets/37984689/3af48f77-2985-4ad0-b004-9940e3f10966)

# Environment Setup

This notebook is designed for Python version **3.11.5** and requires several external packages to run correctly. Below is a list of necessary packages:

- **IPython**: For powerful interactive shells.
- **Pillow** (PIL): For image processing capabilities.
- **ipywidgets**: For interactive HTML widgets.
- **joblib**: For lightweight pipelining.
- **matplotlib**: For creating visualizations.
- **networkx**: For creating and manipulating complex networks.
- **numba**: For JIT compilation.
- **numpy**: For support with large, multi-dimensional arrays and matrices.
- **pandas**: For data manipulation and analysis.
- **requests**: For sending HTTP requests.
- **scipy**: For scientific and technical computing.
- **seaborn**: For drawing attractive statistical graphics.
- **scikit-learn** (sklearn): For machine learning.
- **statsmodels**: For statistical modeling.

To install these packages, run the following command in a code cell:

```python
!pip install IPython Pillow ipywidgets joblib matplotlib networkx numba numpy pandas requests scipy seaborn scikit-learn statsmodels d3blocks
```

Ensure that all packages are installed before proceeding to run the analyses in this notebook.

# References

Hoch M, Smita S, Cesnulevicius K, et al. Network- and enrichment-based inference of phenotypes and targets from large-scale Disease Maps. npj Syst Biol Appl. 2022;8(1):13. [doi:10.1038/s41540-022-00222-z](https://doi.org/10.1038/s41540-022-00222-z)

Hoch M, Ehlers L, Bannert K, et al. In silico investigation of molecular networks linking gastrointestinal diseases, malnutrition, and sarcopenia. Front Nutr. 2022;9. [doi:10.3389/fnut.2022.989453](https://doi.org/10.1038/s41540-022-00222-z)

Hoch M, Rauthe J, Cesnulevicius K, et al. Cell-Type-Specific Gene Regulatory Networks of Pro-Inflammatory and Pro-Resolving Lipid Mediator Biosynthesis in the Immune System. Int J Mol Sci. 2023;24(5):4342. [doi:10.3390/IJMS24054342/S1](https://www.mdpi.com/1422-0067/24/5/4342)
