from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum
from collections import defaultdict
from .models import IncomeAccount, AllowanceAccount, FuelAccount


class RevenueStreamsView(APIView):
    """
    GET: Get revenue and expense streams data
    """
    
    def get(self, request):
        try:
            # Get all income accounts
            income_accounts = IncomeAccount.objects.all()
            
            # Initialize revenue streams
            front_load_amount = 0
            back_load_amount = 0
            
            # Group income accounts by route, date, and reference number
            grouped_accounts = defaultdict(list)
            
            for account in income_accounts:
                # Skip if no route
                if not account.route or str(account.route).strip() == '' or str(account.route).lower() == 'nan':
                    continue
                
                key = (account.route, account.date, account.reference_number)
                grouped_accounts[key].append(account)
            
            # Process each group according to business rules
            for key, accounts in grouped_accounts.items():
                route, date, reference_number = key
                
                if len(accounts) == 1:
                    # Single entry - check if front_load has value
                    account = accounts[0]
                    front_load_value = str(account.front_load).strip()
                    back_load_value = str(account.back_load).strip()
                    
                    if front_load_value and front_load_value != '' and front_load_value.lower() != 'nan':
                        # Both front_load and back_load have values - divide by 2
                        half_amount = float(account.final_total) / 2
                        front_load_amount += half_amount
                        back_load_amount += half_amount
                    else:
                        # No front_load value - all goes to back_load
                        back_load_amount += float(account.final_total)
                else:
                    # Multiple entries - first is front_load, rest are back_load
                    for i, account in enumerate(accounts):
                        if i == 0:
                            front_load_amount += float(account.final_total)
                        else:
                            back_load_amount += float(account.final_total)
            
            # Calculate expense streams
            # Get allowance amounts
            allowance_amount = AllowanceAccount.objects.aggregate(
                total=Sum('final_total')
            )['total'] or 0
            
            # Get fuel amounts from FuelAccount
            fuel_data = FuelAccount.objects.aggregate(
                total=Sum('final_total')
            )
            fuel_amount = fuel_data['total'] or 0
            
            # For now, set add_allowance, add_fuel_amount, and total_opex to 0
            # These would need to be calculated based on specific business rules
            add_allowance = 0
            add_fuel_amount = 0
            total_opex = 0
            
            return Response({
                'revenue_streams': {
                    'front_load_amount': front_load_amount,
                    'back_load_amount': back_load_amount
                },
                'expense_streams': {
                    'allowance': float(allowance_amount),
                    'add_allowance': add_allowance,
                    'fuel_amount': float(fuel_amount),
                    'add_fuel_amount': add_fuel_amount,
                    'total_opex': total_opex
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch revenue streams data: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



