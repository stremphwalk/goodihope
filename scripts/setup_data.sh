#!/bin/bash

# Create necessary directories
mkdir -p data/fda/processed

# Function to download FDA drug data
download_fda_data() {
    echo "Downloading FDA drug data..."
    
    # URL for FDA drug data
    FDA_URL="https://download.open.fda.gov/drug/drugsfda/drug-drugsfda-0001-of-0001.json.zip"
    
    # Check if wget is installed
    if ! command -v wget &> /dev/null; then
        echo "wget is not installed. Installing wget..."
        brew install wget
    fi
    
    # Download the file using wget
    wget -O data/fda/fda_drugs.zip "$FDA_URL"
    
    if [ $? -eq 0 ]; then
        # Unzip the file
        unzip -o data/fda/fda_drugs.zip -d data/fda/
        
        # Clean up zip file
        rm data/fda/fda_drugs.zip
        
        echo "FDA drug data downloaded successfully"
    else
        echo "Failed to download FDA drug data. Please check your internet connection and try again."
        exit 1
    fi
}

# Function to process data files
process_data() {
    echo "Processing data files..."
    
    # Check if Python is installed
    if ! command -v python3 &> /dev/null; then
        echo "Python 3 is required but not installed. Please install Python 3 and try again."
        exit 1
    fi
    
    # Check if required Python packages are installed
    echo "Installing required Python packages..."
    pip3 install pandas
    
    # Process FDA data
    python3 scripts/process_fda_data.py
    
    echo "Data processing completed"
}

# Main execution
echo "Starting data setup..."

# Download FDA data
download_fda_data

# Process the data
process_data

echo "Data setup completed successfully!" 