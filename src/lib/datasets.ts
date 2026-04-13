import type { DatasetRegistryItem } from './types';

export const DATASET_REGISTRY: DatasetRegistryItem[] = [
  {
    name: 'Oral Cancer Prediction Dataset (archive.zip)',
    source: 'Local import from archive.zip',
    modality: 'tabular',
    license: 'Unspecified in archive package',
    status: 'active',
    notes: 'Converted into OralGuard schema via prepare_archive_dataset.py.',
  },
  {
    name: 'TCGA-HNSC Clinical/Biospecimen',
    source: 'GDC Data Portal',
    modality: 'clinical-json',
    license: 'GDC terms and controlled data policies',
    status: 'reference',
    notes: 'Available as JSON cohorts; requires custom mapping to OralGuard features.',
  },
  {
    name: 'Zenodo Oral Lesion Images (sample)',
    source: 'Zenodo record 14954544',
    modality: 'image',
    license: 'CC BY 4.0 + access restrictions',
    status: 'restricted',
    notes: 'Sample only; full dataset access requires formal request and compliance.',
  },
  {
    name: 'Kaggle Oral Cancer Prediction Dataset',
    source: 'KaggleHub / kaggle datasets',
    modality: 'tabular',
    license: 'Per-dataset Kaggle license terms',
    status: 'reference',
    notes: 'Supported through prepare_dataset.py with explicit column mapping.',
  },
  {
    name: 'Multimodal Oncology Review (DOI 10.3389/frai.2024.1408843)',
    source: 'Frontiers in Artificial Intelligence',
    modality: 'literature',
    license: 'CC BY (article)',
    status: 'reference',
    notes: 'Research guidance only; not a direct training dataset.',
  },
];

