import json
import os
import pandas as pd
from pathlib import Path

def process_fda_data(input_file, output_dir):
    """
    Process FDA drug data and create optimized versions for the application.
    
    Args:
        input_file (str): Path to the raw FDA drug data JSON file
        output_dir (str): Directory to save processed data
    """
    print(f"Processing FDA data from {input_file}...")
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Read the JSON data
    with open(input_file, 'r') as f:
        data = json.load(f)
    
    # Extract relevant fields and create a simplified version
    simplified_data = []
    for item in data.get('results', []):
        simplified_item = {
            'brand_name': item.get('brand_name', ''),
            'generic_name': item.get('generic_name', ''),
            'manufacturer_name': item.get('manufacturer_name', ''),
            'product_type': item.get('product_type', ''),
            'active_ingredients': item.get('active_ingredients', []),
            'route': item.get('route', ''),
            'substance_name': item.get('substance_name', ''),
            'application_number': item.get('application_number', '')
        }
        simplified_data.append(simplified_item)
    
    # Save simplified JSON
    simplified_file = os.path.join(output_dir, 'fda_drugs_simplified.json')
    with open(simplified_file, 'w') as f:
        json.dump(simplified_data, f, indent=2)
    
    # Create a CSV version for easier viewing
    df = pd.DataFrame(simplified_data)
    csv_file = os.path.join(output_dir, 'fda_drugs.csv')
    df.to_csv(csv_file, index=False)
    
    print(f"Processed data saved to {output_dir}")
    print(f"- Simplified JSON: {simplified_file}")
    print(f"- CSV version: {csv_file}")

if __name__ == "__main__":
    # Get the project root directory
    project_root = Path(__file__).parent.parent
    
    # Define input and output paths
    input_file = os.path.join(project_root, 'data', 'fda', 'drug-drugsfda-0001-of-00014.json')
    output_dir = os.path.join(project_root, 'data', 'fda', 'processed')
    
    # Process the data
    process_fda_data(input_file, output_dir) 