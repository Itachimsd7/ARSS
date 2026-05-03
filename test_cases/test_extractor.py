from modules.parser import extract_text
from modules.extractor import extract_info
import os

folder_path = "data/resumes"

for file in os.listdir(folder_path):
    file_path = os.path.join(folder_path, file)
    
    print(f"\nProcessing: {file}")
    
    text = extract_text(file_path)
    data = extract_info(text)
    
    print("Extracted Data:")
    print(data)