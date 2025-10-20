from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import TruckingAccount
import pandas as pd
import re

# Helper functions for load validation and cleaning
# Update the INVALID_LOADS set to be more comprehensive
INVALID_LOADS = {
    'sa', 'hw', 'on', 'daily', 'the', 'and', 'or', 'but', 'in', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'up', 'down', 'out', 'off', 'over', 'under',
    'lro', 'liters', 'fuel', 'oil', 'ug', 'ni', 'mag', 'para', 'additional',
    'transport', 'goods', 'items', 'load', 'delivery', 'pickup', 'mao',
    'transfer', 'pundo', 'tangke', 'bugas', 'humay'
}

def is_valid_load(load_value):
    """Enhanced validation for load values"""
    if not load_value or len(load_value.strip()) < 2:
        return False
    
    load_clean = load_value.strip()
    
    # Check if it's all digits
    if load_clean.isdigit():
        return False
    
    # Known valid loads (whitelist)
    valid_loads = {
        'strike', 'cement', 'cemento', 'rh holcim', 'backload cdo', 
        'humay', 'bugas', 'rice', 'gravel', 'sand'
    }
    
    # Check if it's a known valid load
    if load_clean.lower() in valid_loads:
        return True
    
    # Check each word
    words = load_clean.lower().split()
    
    # Single word validation
    if len(words) == 1:
        # Reject if in invalid list
        if words[0] in INVALID_LOADS:
            return False
        # Accept if it looks like a load (3+ chars, not all special chars)
        return len(words[0]) >= 3 and words[0].isalpha()
    
    # Multi-word validation
    # Count invalid words
    invalid_count = sum(1 for word in words if word in INVALID_LOADS)
    
    # Reject if more than half are invalid
    if invalid_count > len(words) / 2:
        return False
    
    # Accept multi-word loads that have at least one valid-looking word
    return any(len(word) >= 3 and word.isalpha() for word in words)

def clean_load_value(load_value):
    """Enhanced cleaning for load values"""
    if not load_value:
        return None
    
    load_clean = str(load_value).strip()
    
    # Special cases (whitelist)
    special_cases = {
        'backload cdo': 'Backload CDO',
        'rh holcim': 'RH Holcim',
        'strike holcim': 'Strike Holcim',
        'strike': 'Strike',
        'cement': 'Cement',
        'cemento': 'Cemento',
        # 'humay': 'Humay',
        # 'bugas': 'Bugas'
    }
    
    if load_clean.lower() in special_cases:
        return special_cases[load_clean.lower()]
    
    # Remove unwanted trailing words
    unwanted_suffixes = [
        'deliver', 'backload', 'kuha', 'ug', 'ni', 'sa', 
        'mag', 'para', 'additional', 'pundo', 'tangke'
    ]
    
    words = load_clean.split()
    filtered_words = []
    
    for word in words:
        if word.lower() not in unwanted_suffixes:
            filtered_words.append(word)
    
    if filtered_words:
        cleaned = ' '.join(filtered_words)
        if is_valid_load(cleaned):
            return cleaned
    
    # If cleaning removed everything, return original if valid
    return load_clean if is_valid_load(load_clean) else None

class TruckingAccountPreviewView(APIView):
    """
    POST: Upload Excel file and preview parsed data without saving to database
    """
    def post(self, request):
        try:
            if 'file' not in request.FILES:
                return Response(
                    {'error': 'No file provided'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            file = request.FILES['file']
            
            # Read Excel file
            df = pd.read_excel(file)
            
            # Clean column names
            df.columns = df.columns.str.strip()
            
            # Map Excel columns to model fields
            column_mapping = {
                'AccountNumber': 'account_number',
                'AccountType': 'account_type',
                'TruckType': 'truck_type',
                'PlateNumber': 'plate_number',
                'Description': 'description',
                'Debit': 'debit',
                'Credit': 'credit',
                'FinalTotal': 'final_total',
                'Remarks': 'remarks',
                'ReferenceNumber': 'reference_number',
                'Date': 'date',
                'Quantity': 'quantity',
                'Price': 'price',
                'Driver': 'driver',
                'Route': 'route',
                'Front_Load': 'front_load',
                'Back_Load': 'back_load'
            }
            
            # Rename columns
            df = df.rename(columns=column_mapping)
            
            # Remove rows with 'Total for' in any column
            df = df[~df.astype(str).apply(lambda x: x.str.contains('Total for', case=False, na=False)).any(axis=1)]
            
            # Set Beginning Balance values to 0
            beginning_balance_mask = df['description'].astype(str).str.contains('Beginning Balance', case=False, na=False)
            df.loc[beginning_balance_mask, 'debit'] = 0
            df.loc[beginning_balance_mask, 'credit'] = 0
            df.loc[beginning_balance_mask, 'final_total'] = 0
            
            # Include the same enhanced parsing functions here
            def extract_driver_from_remarks(remarks):
                if pd.isna(remarks) or remarks is None:
                    return None
                remarks_str = str(remarks)
                
                # Known drivers list
                drivers = [
                    'Edgardo Agapay', 'Romel Bantilan', 'Reynaldo Rizalda', 'Francis Ariglado',
                    'Roque Oling', 'Pablo Hamo', 'Albert Saavedra', 'Jimmy Oclarit', 'Nicanor',
                    'Arnel Duhilag', 'Benjamin Aloso', 'Roger', 'Joseph Bahan', 'Doming',
                    'Jun2x Campaña', 'Jun2x Toledo', 'Ronie Babanto'
                ]
                
                # Pattern 1: Check for known drivers first (exact match)
                for driver in drivers:
                    if driver in remarks_str:
                        return driver
                
                # Pattern 2: Handle multiple drivers with "/" (e.g., "Jimmy Oclarit/Romel Bantilan")
                # Look for pattern: "Name1/Name2:" before route
                multi_driver_pattern = r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*):'
                multi_match = re.search(multi_driver_pattern, remarks_str)
                if multi_match:
                    driver1 = multi_match.group(1).strip()
                    driver2 = multi_match.group(2).strip()
                    # Verify at least one is a known driver
                    for driver in drivers:
                        if driver in driver1 or driver in driver2:
                            return f"{driver1}/{driver2}"
                
                # Pattern 3: Extract driver from "LRO: XXLiters Fuel and Oil [DRIVER]:"
                # This handles cases like "LRO: 140Liters Fuel and Oil Roque Oling:"
                lro_pattern = r'LRO:\s*\d+Liters\s+Fuel\s+and\s+Oil\s+(?:[A-Z]+-\d+\s+)?([A-Za-z\s]+?)(?::|;)'
                lro_match = re.search(lro_pattern, remarks_str)
                if lro_match:
                    potential_driver = lro_match.group(1).strip()
                    # Clean up and validate
                    if len(potential_driver) > 2 and not any(word in potential_driver.lower() for word in ['lro', 'liters', 'fuel', 'oil']):
                        # Check if it's a known driver or looks like a name
                        for driver in drivers:
                            if driver.lower() in potential_driver.lower():
                                return driver
                        # If not known but looks like a name (2+ words), return it
                        if len(potential_driver.split()) >= 2:
                            return potential_driver
                
                # Pattern 4: Look for "Name:" pattern (but filter out routes and common words)
                name_pattern = r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+):'
                matches = re.finditer(name_pattern, remarks_str)
                for match in matches:
                    potential_driver = match.group(1).strip()
                    # Skip if it looks like a route
                    if any(route_word in potential_driver.upper() for route_word in ['PAG-', 'CDO', 'ILIGAN', 'STRIKE']):
                        continue
                    # Skip common non-driver words
                    if any(word in potential_driver.lower() for word in ['lro', 'liters', 'fuel', 'oil', 'deliver', 'transfer']):
                        continue
                    # Check if it's a known driver
                    for driver in drivers:
                        if driver.lower() == potential_driver.lower():
                            return driver
                    # If it has 2+ words and looks like a name, return it
                    if len(potential_driver.split()) >= 2:
                        return potential_driver
                
                return None

            def extract_route_from_remarks(remarks):
                if pd.isna(remarks) or remarks is None:
                    return None
                remarks_str = str(remarks)
                
                # Known routes list
                routes = [
                    'PAG-CDO', 'PAG-ILIGAN', 'Strike Holcim', 'PAG-ILIGAN STRIKE', 'PAG-CDO (CARGILL)',
                    'PAG-CDO STRIKE', 'PAG-BUK', 'PAG-DIPLAHAN', 'PAG-MARANDING', 'PAG-COTABATO',
                    'PAG-ZMBGA', 'Pag-COTABATO', 'Pag-AURORA', 'PAG-DIPOLOG', 'PAG-MOLAVE', 'PAGADIAN',
                    'PAG-DIMATALING', 'PAG-DINAS', 'PAG-LABANGAN', 'PAG-MIDSALIP', 'PAG-OZAMIS',
                    'PAG-OSMENIA', 'PAG-DUMINGAG', 'PAG-KUMALARANG', 'PAG-MAHAYAG', 'PAG-TAMBULIG',
                    'PAG-SURIGAO', 'PAG-BUYOGAN', 'PAG-SAN PABLO', 'PAGADIAN-OPEX', 'CDO-OPEX',
                    'PAG-BAYOG', 'PAG-LAKEWOOD', 'PAG-BUUG', 
                    #'DIMATALING', 'DUMINGAG'
                ]
                
                # Pattern 1: Look for route with colon after it (e.g., "PAG-ILIGAN:")
                # This is the most reliable pattern
                route_with_colon = r'(PAG-[A-Z]+|DIMATALING|DUMINGAG|Strike\s+Holcim|CDO-OPEX|PAGADIAN-OPEX|PAGADIAN):'
                match = re.search(route_with_colon, remarks_str, re.IGNORECASE)
                if match:
                    potential_route = match.group(1).strip()
                    # Match against known routes (case-insensitive)
                    for route in routes:
                        if route.upper() == potential_route.upper():
                            return route
                
                # Pattern 2: Look for routes in specific contexts (after driver name)
                # E.g., "Roque Oling: PAG-ILIGAN:" or after plate number
                context_pattern = r':\s*(PAG-[A-Z]+|DIMATALING|DUMINGAG)[\s:]'
                match = re.search(context_pattern, remarks_str, re.IGNORECASE)
                if match:
                    potential_route = match.group(1).strip()
                    for route in routes:
                        if route.upper() == potential_route.upper():
                            return route
                
                # Pattern 3: Check for routes anywhere in the text (case-insensitive)
                for route in routes:
                    if route.upper() in remarks_str.upper():
                        return route
                
                return None

            
            def extract_loads_from_remarks(remarks):
                if pd.isna(remarks) or remarks is None:
                    return None, None
                remarks_str = str(remarks)
                
                front_load = None
                back_load = None
                
                # Pattern 1: "Strike/Cement:", "RH Holcim/Cement:" - most specific pattern
                # This matches: colon, space, load1/load2, colon
                load_pattern_specific = r':\s*([A-Za-z\s]+)/([A-Za-z\s]+):'
                match = re.search(load_pattern_specific, remarks_str)
                if match:
                    potential_front = match.group(1).strip()
                    potential_back = match.group(2).strip()
                    
                    # Validate both loads
                    if is_valid_load(potential_front) and is_valid_load(potential_back):
                        return clean_load_value(potential_front), clean_load_value(potential_back)
                
                # Pattern 2: "Strike/Cement" at end of string (no trailing colon)
                load_pattern_end = r':\s*([A-Za-z\s]+)/([A-Za-z\s]+)\s*$'
                match = re.search(load_pattern_end, remarks_str)
                if match:
                    potential_front = match.group(1).strip()
                    potential_back = match.group(2).strip()
                    
                    if is_valid_load(potential_front) and is_valid_load(potential_back):
                        return clean_load_value(potential_front), clean_load_value(potential_back)
                
                # # Pattern 3: "deliver cemento backload humay" - delivery pattern
                # deliver_backload = r'deliver\s+([a-zA-Z]+)\s+backload\s+([a-zA-Z]+)'
                # match = re.search(deliver_backload, remarks_str, re.IGNORECASE)
                # if match:
                #     potential_front = match.group(1).strip()
                #     potential_back = match.group(2).strip()
                    
                #     if is_valid_load(potential_front) and is_valid_load(potential_back):
                #         return clean_load_value(potential_front), clean_load_value(potential_back)
                
                # Pattern 4: Single load - "deliver cemento" or "deliver ug cemento"
                single_deliver = r'deliver\s+(?:ug\s+)?([a-zA-Z]+)'
                match = re.search(single_deliver, remarks_str, re.IGNORECASE)
                if match:
                    potential_load = match.group(1).strip()
                    if is_valid_load(potential_load):
                        return clean_load_value(potential_load), None
                
                # # Pattern 5: "kuha humay" or "kuha ug humay" - pickup pattern
                # kuha_pattern = r'kuha\s+(?:ug\s+)?([a-zA-Z]+)'
                # match = re.search(kuha_pattern, remarks_str, re.IGNORECASE)
                # if match:
                #     potential_back = match.group(1).strip()
                #     if is_valid_load(potential_back):
                #         return front_load, clean_load_value(potential_back)
                
                # Pattern 6: Look for load patterns after route
                # E.g., "PAG-ILIGAN: Strike/Cement:"
                after_route = r'(?:PAG-[A-Z]+|DIMATALING|DUMINGAG):\s*([A-Za-z\s]+)/([A-Za-z\s]+)'
                match = re.search(after_route, remarks_str, re.IGNORECASE)
                if match:
                    potential_front = match.group(1).strip()
                    potential_back = match.group(2).strip()
                    
                    if is_valid_load(potential_front) and is_valid_load(potential_back):
                        return clean_load_value(potential_front), clean_load_value(potential_back)
                
                return front_load, back_load

            # Convert driver, route, front_load, back_load columns to object type to avoid dtype warnings
            if 'driver' in df.columns:
                df['driver'] = df['driver'].astype('object')
            if 'route' in df.columns:
                df['route'] = df['route'].astype('object')
            if 'front_load' in df.columns:
                df['front_load'] = df['front_load'].astype('object')
            if 'back_load' in df.columns:
                df['back_load'] = df['back_load'].astype('object')
            
            # Apply parsing to extract driver, route, front_load, back_load from remarks
            # Always extract from remarks to override any existing values
            if 'remarks' in df.columns:
                for index, row in df.iterrows():
                    # Always extract driver from remarks if available
                    extracted_driver = extract_driver_from_remarks(row.get('remarks'))
                    if extracted_driver:
                        df.at[index, 'driver'] = extracted_driver
                    
                    # Always extract route from remarks if available
                    extracted_route = extract_route_from_remarks(row.get('remarks'))
                    if extracted_route:
                        df.at[index, 'route'] = extracted_route
                    
                    # Only extract loads if BOTH driver AND route are present
                    # This prevents extracting maintenance items like "Fan Belt/Grease" as loads
                    if extracted_driver and extracted_route:
                        extracted_front, extracted_back = extract_loads_from_remarks(row.get('remarks'))
                        if extracted_front:
                            # Clean the front load value to remove extra text
                            cleaned_front = clean_load_value(extracted_front)
                            if cleaned_front:
                                df.at[index, 'front_load'] = cleaned_front
                        if extracted_back:
                            # Clean the back load value to remove extra text
                            cleaned_back = clean_load_value(extracted_back)
                            if cleaned_back:
                                df.at[index, 'back_load'] = cleaned_back
            
            # Invert final_total sign for hauling income accounts
            if 'account_type' in df.columns and 'final_total' in df.columns:
                hauling_income_mask = df['account_type'].astype(str).str.contains('Hauling Income', case=False, na=False)
                df.loc[hauling_income_mask, 'final_total'] = df.loc[hauling_income_mask, 'final_total'] * -1
            
            # Convert to list of dictionaries for preview - show ALL columns
            preview_data = []
            parsing_stats = {
                'drivers_extracted': 0,
                'routes_extracted': 0,
                'loads_extracted': 0,
                'total_rows': len(df)
            }
            
            def safe_convert(value, default=None):
                """Safely convert value, handling NaN and None"""
                if pd.isna(value) or value is None:
                    return default
                if isinstance(value, (int, float)):
                    if pd.isna(value):
                        return default
                    return value
                return str(value) if value != '' else default
            
            for index, row in df.iterrows():
                if pd.isna(row.get('account_number')) or row.get('account_number') == '':
                    continue
                
                if row.get('driver') and row.get('driver') != '':
                    parsing_stats['drivers_extracted'] += 1
                if row.get('route') and row.get('route') != '':
                    parsing_stats['routes_extracted'] += 1
                if row.get('front_load') and row.get('front_load') != '':
                    parsing_stats['loads_extracted'] += 1
                
                # Create row data with ALL columns from the original Excel file
                row_data = {'row_number': index + 1}
                
                # Add all columns from the DataFrame
                for col in df.columns:
                    row_data[col] = safe_convert(row.get(col))
                
                preview_data.append(row_data)
            
            response_data = {
                'preview_data': preview_data,  # Show all rows for preview
                'parsing_stats': parsing_stats,
                'message': f'Preview generated for {len(preview_data)} rows',
                'total_rows': len(preview_data)
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to generate preview: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TruckingAccountUploadView(APIView):
    """
    POST: Upload Excel file and bulk create trucking accounts with automatic parsing
    """
    def post(self, request):
        try:
            if 'file' not in request.FILES:
                return Response(
                    {'error': 'No file provided'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            file = request.FILES['file']
            
            # Read Excel file
            df = pd.read_excel(file)
            
            # Clean column names
            df.columns = df.columns.str.strip()
            
            # Map Excel columns to model fields
            column_mapping = {
                'AccountNumber': 'account_number',
                'AccountType': 'account_type',
                'TruckType': 'truck_type',
                'PlateNumber': 'plate_number',
                'Description': 'description',
                'Debit': 'debit',
                'Credit': 'credit',
                'FinalTotal': 'final_total',
                'Remarks': 'remarks',
                'ReferenceNumber': 'reference_number',
                'Date': 'date',
                'Quantity': 'quantity',
                'Price': 'price',
                'Driver': 'driver',
                'Route': 'route',
                'Front_Load': 'front_load',
                'Back_Load': 'back_load'
            }
            
            # Rename columns
            df = df.rename(columns=column_mapping)
            
            # Remove rows with 'Total for' in any column
            df = df[~df.astype(str).apply(lambda x: x.str.contains('Total for', case=False, na=False)).any(axis=1)]
            
            # Set Beginning Balance values to 0
            beginning_balance_mask = df['description'].astype(str).str.contains('Beginning Balance', case=False, na=False)
            df.loc[beginning_balance_mask, 'debit'] = 0
            df.loc[beginning_balance_mask, 'credit'] = 0
            df.loc[beginning_balance_mask, 'final_total'] = 0
            
            # Enhanced parsing functions based on the image data patterns
            def extract_driver_from_remarks(remarks):
                if pd.isna(remarks) or remarks is None:
                    return None
                remarks_str = str(remarks)
                
                # Known drivers list
                drivers = [
                    'Edgardo Agapay', 'Romel Bantilan', 'Reynaldo Rizalda', 'Francis Ariglado',
                    'Roque Oling', 'Pablo Hamo', 'Albert Saavedra', 'Jimmy Oclarit', 'Nicanor',
                    'Arnel Duhilag', 'Benjamin Aloso', 'Roger', 'Joseph Bahan', 'Doming',
                    'Jun2x Campaña', 'Jun2x Toledo', 'Ronie Babanto'
                ]
                
                # Pattern 1: Check for known drivers first (exact match)
                for driver in drivers:
                    if driver in remarks_str:
                        return driver
                
                # Pattern 2: Handle multiple drivers with "/" (e.g., "Jimmy Oclarit/Romel Bantilan")
                # Look for pattern: "Name1/Name2:" before route
                multi_driver_pattern = r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*):'
                multi_match = re.search(multi_driver_pattern, remarks_str)
                if multi_match:
                    driver1 = multi_match.group(1).strip()
                    driver2 = multi_match.group(2).strip()
                    # Verify at least one is a known driver
                    for driver in drivers:
                        if driver in driver1 or driver in driver2:
                            return f"{driver1}/{driver2}"
                
                # Pattern 3: Extract driver from "LRO: XXLiters Fuel and Oil [DRIVER]:"
                # This handles cases like "LRO: 140Liters Fuel and Oil Roque Oling:"
                lro_pattern = r'LRO:\s*\d+Liters\s+Fuel\s+and\s+Oil\s+(?:[A-Z]+-\d+\s+)?([A-Za-z\s]+?)(?::|;)'
                lro_match = re.search(lro_pattern, remarks_str)
                if lro_match:
                    potential_driver = lro_match.group(1).strip()
                    # Clean up and validate
                    if len(potential_driver) > 2 and not any(word in potential_driver.lower() for word in ['lro', 'liters', 'fuel', 'oil']):
                        # Check if it's a known driver or looks like a name
                        for driver in drivers:
                            if driver.lower() in potential_driver.lower():
                                return driver
                        # If not known but looks like a name (2+ words), return it
                        if len(potential_driver.split()) >= 2:
                            return potential_driver
                
                # Pattern 4: Look for "Name:" pattern (but filter out routes and common words)
                name_pattern = r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+):'
                matches = re.finditer(name_pattern, remarks_str)
                for match in matches:
                    potential_driver = match.group(1).strip()
                    # Skip if it looks like a route
                    if any(route_word in potential_driver.upper() for route_word in ['PAG-', 'CDO', 'ILIGAN', 'STRIKE']):
                        continue
                    # Skip common non-driver words
                    if any(word in potential_driver.lower() for word in ['lro', 'liters', 'fuel', 'oil', 'deliver', 'transfer']):
                        continue
                    # Check if it's a known driver
                    for driver in drivers:
                        if driver.lower() == potential_driver.lower():
                            return driver
                    # If it has 2+ words and looks like a name, return it
                    if len(potential_driver.split()) >= 2:
                        return potential_driver
                
                return None

            def extract_route_from_remarks(remarks):
                if pd.isna(remarks) or remarks is None:
                    return None
                remarks_str = str(remarks)
                
                # Known routes list
                routes = [
                    'PAG-CDO', 'PAG-ILIGAN', 'Strike Holcim', 'PAG-ILIGAN STRIKE', 'PAG-CDO (CARGILL)',
                    'PAG-CDO STRIKE', 'PAG-BUK', 'PAG-DIPLAHAN', 'PAG-MARANDING', 'PAG-COTABATO',
                    'PAG-ZMBGA', 'Pag-COTABATO', 'Pag-AURORA', 'PAG-DIPOLOG', 'PAG-MOLAVE', 'PAGADIAN',
                    'PAG-DIMATALING', 'PAG-DINAS', 'PAG-LABANGAN', 'PAG-MIDSALIP', 'PAG-OZAMIS',
                    'PAG-OSMENIA', 'PAG-DUMINGAG', 'PAG-KUMALARANG', 'PAG-MAHAYAG', 'PAG-TAMBULIG',
                    'PAG-SURIGAO', 'PAG-BUYOGAN', 'PAG-SAN PABLO', 'PAGADIAN-OPEX', 'CDO-OPEX',
                    'PAG-BAYOG', 'PAG-LAKEWOOD', 'PAG-BUUG', 
                    #'DIMATALING', 'DUMINGAG'
                ]
                
                # Pattern 1: Look for route with colon after it (e.g., "PAG-ILIGAN:")
                # This is the most reliable pattern
                route_with_colon = r'(PAG-[A-Z]+|DIMATALING|DUMINGAG|Strike\s+Holcim|CDO-OPEX|PAGADIAN-OPEX|PAGADIAN):'
                match = re.search(route_with_colon, remarks_str, re.IGNORECASE)
                if match:
                    potential_route = match.group(1).strip()
                    # Match against known routes (case-insensitive)
                    for route in routes:
                        if route.upper() == potential_route.upper():
                            return route
                
                # Pattern 2: Look for routes in specific contexts (after driver name)
                # E.g., "Roque Oling: PAG-ILIGAN:" or after plate number
                context_pattern = r':\s*(PAG-[A-Z]+|DIMATALING|DUMINGAG)[\s:]'
                match = re.search(context_pattern, remarks_str, re.IGNORECASE)
                if match:
                    potential_route = match.group(1).strip()
                    for route in routes:
                        if route.upper() == potential_route.upper():
                            return route
                
                # Pattern 3: Check for routes anywhere in the text (case-insensitive)
                for route in routes:
                    if route.upper() in remarks_str.upper():
                        return route
                
                return None

            def extract_loads_from_remarks(remarks):
                if pd.isna(remarks) or remarks is None:
                    return None, None
                remarks_str = str(remarks)
                
                front_load = None
                back_load = None
                
                # Pattern 1: "Strike/Cement:", "RH Holcim/Cement:" - most specific pattern
                # This matches: colon, space, load1/load2, colon
                load_pattern_specific = r':\s*([A-Za-z\s]+)/([A-Za-z\s]+):'
                match = re.search(load_pattern_specific, remarks_str)
                if match:
                    potential_front = match.group(1).strip()
                    potential_back = match.group(2).strip()
                    
                    # Validate both loads
                    if is_valid_load(potential_front) and is_valid_load(potential_back):
                        return clean_load_value(potential_front), clean_load_value(potential_back)
                
                # Pattern 2: "Strike/Cement" at end of string (no trailing colon)
                load_pattern_end = r':\s*([A-Za-z\s]+)/([A-Za-z\s]+)\s*$'
                match = re.search(load_pattern_end, remarks_str)
                if match:
                    potential_front = match.group(1).strip()
                    potential_back = match.group(2).strip()
                    
                    if is_valid_load(potential_front) and is_valid_load(potential_back):
                        return clean_load_value(potential_front), clean_load_value(potential_back)
                
                # Pattern 3: "deliver cemento backload humay" - delivery pattern
                deliver_backload = r'deliver\s+([a-zA-Z]+)\s+backload\s+([a-zA-Z]+)'
                match = re.search(deliver_backload, remarks_str, re.IGNORECASE)
                if match:
                    potential_front = match.group(1).strip()
                    potential_back = match.group(2).strip()
                    
                    if is_valid_load(potential_front) and is_valid_load(potential_back):
                        return clean_load_value(potential_front), clean_load_value(potential_back)
                
                # Pattern 4: Single load - "deliver cemento" or "deliver ug cemento"
                single_deliver = r'deliver\s+(?:ug\s+)?([a-zA-Z]+)'
                match = re.search(single_deliver, remarks_str, re.IGNORECASE)
                if match:
                    potential_load = match.group(1).strip()
                    if is_valid_load(potential_load):
                        return clean_load_value(potential_load), None
                
                # Pattern 5: "kuha humay" or "kuha ug humay" - pickup pattern
                kuha_pattern = r'kuha\s+(?:ug\s+)?([a-zA-Z]+)'
                match = re.search(kuha_pattern, remarks_str, re.IGNORECASE)
                if match:
                    potential_back = match.group(1).strip()
                    if is_valid_load(potential_back):
                        return front_load, clean_load_value(potential_back)
                
                # Pattern 6: Look for load patterns after route
                # E.g., "PAG-ILIGAN: Strike/Cement:"
                after_route = r'(?:PAG-[A-Z]+|DIMATALING|DUMINGAG):\s*([A-Za-z\s]+)/([A-Za-z\s]+)'
                match = re.search(after_route, remarks_str, re.IGNORECASE)
                if match:
                    potential_front = match.group(1).strip()
                    potential_back = match.group(2).strip()
                    
                    if is_valid_load(potential_front) and is_valid_load(potential_back):
                        return clean_load_value(potential_front), clean_load_value(potential_back)
                
                return front_load, back_load

            # Apply parsing to extract driver, route, front_load, back_load from remarks
            # Always extract from remarks to override any existing values
            if 'remarks' in df.columns:
                for index, row in df.iterrows():
                    # Always extract driver from remarks if available
                    extracted_driver = extract_driver_from_remarks(row.get('remarks'))
                    if extracted_driver:
                        df.at[index, 'driver'] = extracted_driver
                    
                    # Always extract route from remarks if available
                    extracted_route = extract_route_from_remarks(row.get('remarks'))
                    if extracted_route:
                        df.at[index, 'route'] = extracted_route
                    
                    # Only extract loads if BOTH driver AND route are present
                    # This prevents extracting maintenance items like "Fan Belt/Grease" as loads
                    if extracted_driver and extracted_route:
                        extracted_front, extracted_back = extract_loads_from_remarks(row.get('remarks'))
                        if extracted_front:
                            # Clean the front load value to remove extra text
                            cleaned_front = clean_load_value(extracted_front)
                            if cleaned_front:
                                df.at[index, 'front_load'] = cleaned_front
                        if extracted_back:
                            # Clean the back load value to remove extra text
                            cleaned_back = clean_load_value(extracted_back)
                            if cleaned_back:
                                df.at[index, 'back_load'] = cleaned_back
            
            # Clean and convert data
            def clean_decimal(value):
                if pd.isna(value) or value == '' or value == 'nan':
                    return 0
                try:
                    return float(value)
                except (ValueError, TypeError):
                    return 0
            
            # Convert numeric fields
            numeric_fields = ['debit', 'credit', 'final_total', 'quantity', 'price']
            for field in numeric_fields:
                if field in df.columns:
                    df[field] = df[field].apply(clean_decimal)
            
            # Convert date field
            if 'date' in df.columns:
                df['date'] = pd.to_datetime(df['date'], errors='coerce')
            
            # Clean string fields
            string_fields = ['account_number', 'account_type', 'truck_type', 'plate_number', 
                           'description', 'remarks', 'reference_number', 'driver', 'route', 
                           'front_load', 'back_load']
            for field in string_fields:
                if field in df.columns:
                    df[field] = df[field].astype(str).replace('nan', '').replace('None', '')
            
            # Invert final_total sign for hauling income accounts
            if 'account_type' in df.columns and 'final_total' in df.columns:
                hauling_income_mask = df['account_type'].astype(str).str.contains('Hauling Income', case=False, na=False)
                df.loc[hauling_income_mask, 'final_total'] = df.loc[hauling_income_mask, 'final_total'] * -1
            
            # Create accounts
            created_count = 0
            errors = []
            parsing_stats = {
                'drivers_extracted': 0,
                'routes_extracted': 0,
                'loads_extracted': 0
            }
            
            for index, row in df.iterrows():
                try:
                    # Skip rows with missing required fields
                    if pd.isna(row.get('account_number')) or row.get('account_number') == '':
                        continue
                    
                    # Track parsing statistics
                    if row.get('driver') and row.get('driver') != '':
                        parsing_stats['drivers_extracted'] += 1
                    if row.get('route') and row.get('route') != '':
                        parsing_stats['routes_extracted'] += 1
                    if row.get('front_load') and row.get('front_load') != '':
                        parsing_stats['loads_extracted'] += 1
                    
                    # Create TruckingAccount instance
                    account = TruckingAccount(
                        account_number=row.get('account_number', ''),
                        account_type=row.get('account_type', ''),
                        truck_type=row.get('truck_type', ''),
                        plate_number=row.get('plate_number', '') if row.get('plate_number') != '' else None,
                        description=row.get('description', ''),
                        debit=row.get('debit', 0),
                        credit=row.get('credit', 0),
                        final_total=row.get('final_total', 0),
                        remarks=row.get('remarks', ''),
                        reference_number=row.get('reference_number', '') if row.get('reference_number') != '' else None,
                        date=row.get('date') if not pd.isna(row.get('date')) else None,
                        quantity=row.get('quantity') if not pd.isna(row.get('quantity')) and row.get('quantity') != 0 else None,
                        price=row.get('price') if not pd.isna(row.get('price')) and row.get('price') != 0 else None,
                        driver=row.get('driver', '') if row.get('driver') != '' else None,
                        route=row.get('route', '') if row.get('route') != '' else None,
                        front_load=row.get('front_load', '') if row.get('front_load') != '' else None,
                        back_load=row.get('back_load', '') if row.get('back_load') != '' else None,
                    )
                    
                    account.save()
                    created_count += 1
                    
                except Exception as e:
                    errors.append(f"Row {index + 1}: {str(e)}")
                    continue
            
            return Response({
                'message': f'Successfully created {created_count} trucking accounts',
                'created_count': created_count,
                'parsing_stats': parsing_stats,
                'errors': errors[:10] if errors else []  # Show first 10 errors
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to process file: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
