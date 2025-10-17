from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import SalaryAccount
import pandas as pd
import re

class SalaryAccountUploadView(APIView):
    """
    POST: Upload Excel file and bulk create salary accounts with automatic parsing
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
            
            # Parse driver, route, front_load, and back_load from remarks if they're not already populated
            def extract_driver_from_remarks(remarks):
                if pd.isna(remarks):
                    return None
                remarks_str = str(remarks)
                drivers = [
                    'Edgardo Agapay', 'Romel Bantilan', 'Reynaldo Rizalda', 'Francis Ariglado',
                    'Roque Oling', 'Pablo Hamo', 'Albert Saavedra', 'Jimmy Oclarit', 'Nicanor',
                    'Arnel Duhilag', 'Benjamin Aloso', 'Roger', 'Joseph Bahan', 'Doming'
                ]
                for driver in drivers:
                    if driver in remarks_str:
                        return driver
                return None

            def extract_route_from_remarks(remarks):
                if pd.isna(remarks):
                    return None
                remarks_str = str(remarks)
                routes = [
                    'PAG-CDO', 'PAG-ILIGAN', 'Strike Holcim', 'PAG-ILIGAN STRIKE', 'PAG-CDO (CARGILL)',
                    'PAG-CDO STRIKE', 'PAG-BUK', 'PAG-DIPLAHAN', 'PAG-MARANDING', 'PAG-COTABATO',
                    'PAG-ZMBGA', 'Pag-COTABATO', 'Pag-AURORA', 'PAG-DIPOLOG', 'PAG-MOLAVE', 'PAGADIAN',
                    'PAG-DIMATALING', 'PAG-DINAS', 'PAG-LABANGAN', 'PAG-MIDSALIP', 'PAG-OZAMIS',
                    'PAG-OSMENIA', 'PAG-DUMINGAG', 'PAG-KUMALARANG', 'PAG-MAHAYAG', 'PAG-TAMBULIG',
                    'PAG-SURIGAO', 'PAG-BUYOGAN', 'PAG-SAN PABLO', 'PAGADIAN-OPEX', 'CDO-OPEX',
                    'PAG-BAYOG', 'PAG-LAKEWOOD', 'PAG-BUUG', 'PAG-DIMATALING'
                ]
                lines = remarks_str.split('\n')
                for line in lines:
                    line_upper = line.upper()
                    for route in routes:
                        route_upper = route.upper()
                        if route_upper in line_upper:
                            return route
                return None

            def extract_loads_from_remarks(remarks):
                if pd.isna(remarks):
                    return None, None
                remarks_str = str(remarks)
                lines = remarks_str.split('\n')
                
                for line in lines:
                    match = re.search(r':\s*([A-Za-z\s]+)/([A-Za-z\s]+)', line)
                    if match:
                        front_load = match.group(1).strip()
                        back_load = match.group(2).strip()
                        
                        if len(front_load) < 30 and len(back_load) < 30:
                            if not front_load.isdigit() and not back_load.isdigit():
                                if 'Liters' not in front_load and 'Fuel' not in front_load:
                                    # Clean the values
                                    back_load = re.split(r'\s+(deliver|Deliver|DELIVER|para|Para|sa|to|ug)', back_load)[0].strip()
                                    back_load = re.sub(r'[:\.,;]+$', '', back_load).strip()
                                    
                                    # Normalize common load types
                                    value_upper = back_load.upper()
                                    if 'CEMENT' in value_upper:
                                        back_load = 'Cement'
                                    elif 'HOLCIM' in value_upper:
                                        if 'RH' in value_upper:
                                            front_load = 'RH Holcim'
                                        else:
                                            front_load = 'Holcim'
                                    
                                    if front_load and back_load:
                                        return front_load, back_load
                return None, None

            # Apply parsing to fill missing driver, route, front_load, back_load from remarks
            if 'remarks' in df.columns:
                # Only fill if the target columns are empty or NaN
                for index, row in df.iterrows():
                    # Extract from remarks if driver is empty
                    if pd.isna(row.get('driver')) or row.get('driver') == '' or row.get('driver') == 'nan':
                        extracted_driver = extract_driver_from_remarks(row.get('remarks'))
                        if extracted_driver:
                            df.at[index, 'driver'] = extracted_driver
                    
                    # Extract from remarks if route is empty
                    if pd.isna(row.get('route')) or row.get('route') == '' or row.get('route') == 'nan':
                        extracted_route = extract_route_from_remarks(row.get('remarks'))
                        if extracted_route:
                            df.at[index, 'route'] = extracted_route
                    
                    # Extract from remarks if front_load and back_load are empty
                    if (pd.isna(row.get('front_load')) or row.get('front_load') == '' or row.get('front_load') == 'nan') and \
                       (pd.isna(row.get('back_load')) or row.get('back_load') == '' or row.get('back_load') == 'nan'):
                        extracted_front, extracted_back = extract_loads_from_remarks(row.get('remarks'))
                        if extracted_front and extracted_back:
                            df.at[index, 'front_load'] = extracted_front
                            df.at[index, 'back_load'] = extracted_back
            
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
                    
                    # Create SalaryAccount instance
                    account = SalaryAccount(
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
                'message': f'Successfully created {created_count} salary accounts',
                'created_count': created_count,
                'parsing_stats': parsing_stats,
                'errors': errors[:10] if errors else []  # Show first 10 errors
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to process file: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
