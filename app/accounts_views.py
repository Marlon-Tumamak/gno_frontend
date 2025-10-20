from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, Count
from .models import (
    RepairAndMaintenanceAccount, 
    InsuranceAccount, 
    FuelAccount, 
    TaxAccount, 
    AllowanceAccount, 
    IncomeAccount
)


class AccountsSummaryView(APIView):
    """
    GET: Get summary of all account types with totals
    """
    
    def get(self, request):
        try:
            # Get all account types with their totals
            accounts_summary = {}
            
            # Repair and Maintenance Accounts
            repair_maintenance = RepairAndMaintenanceAccount.objects.aggregate(
                total_debit=Sum('debit'),
                total_credit=Sum('credit'),
                total_final=Sum('final_total'),
                count=Count('id')
            )
            accounts_summary['repair_maintenance'] = {
                'name': 'Repair & Maintenance',
                'total_debit': float(repair_maintenance['total_debit'] or 0),
                'total_credit': float(repair_maintenance['total_credit'] or 0),
                'total_final': float(repair_maintenance['total_final'] or 0),
                'count': repair_maintenance['count'],
                'color': 'blue'
            }
            
            # Insurance Accounts
            insurance = InsuranceAccount.objects.aggregate(
                total_debit=Sum('debit'),
                total_credit=Sum('credit'),
                total_final=Sum('final_total'),
                count=Count('id')
            )
            accounts_summary['insurance'] = {
                'name': 'Insurance',
                'total_debit': float(insurance['total_debit'] or 0),
                'total_credit': float(insurance['total_credit'] or 0),
                'total_final': float(insurance['total_final'] or 0),
                'count': insurance['count'],
                'color': 'green'
            }
            
            # Fuel Accounts
            fuel = FuelAccount.objects.aggregate(
                total_debit=Sum('debit'),
                total_credit=Sum('credit'),
                total_final=Sum('final_total'),
                count=Count('id')
            )
            accounts_summary['fuel'] = {
                'name': 'Fuel & Oil',
                'total_debit': float(fuel['total_debit'] or 0),
                'total_credit': float(fuel['total_credit'] or 0),
                'total_final': float(fuel['total_final'] or 0),
                'count': fuel['count'],
                'color': 'orange'
            }
            
            # Tax Accounts
            tax = TaxAccount.objects.aggregate(
                total_debit=Sum('debit'),
                total_credit=Sum('credit'),
                total_final=Sum('final_total'),
                count=Count('id')
            )
            accounts_summary['tax'] = {
                'name': 'Tax Account',
                'total_debit': float(tax['total_debit'] or 0),
                'total_credit': float(tax['total_credit'] or 0),
                'total_final': float(tax['total_final'] or 0),
                'count': tax['count'],
                'color': 'red'
            }
            
            # Allowance Accounts
            allowance = AllowanceAccount.objects.aggregate(
                total_debit=Sum('debit'),
                total_credit=Sum('credit'),
                total_final=Sum('final_total'),
                count=Count('id')
            )
            accounts_summary['allowance'] = {
                'name': 'Allowance Account',
                'total_debit': float(allowance['total_debit'] or 0),
                'total_credit': float(allowance['total_credit'] or 0),
                'total_final': float(allowance['total_final'] or 0),
                'count': allowance['count'],
                'color': 'purple'
            }
            
            # Income Accounts
            income = IncomeAccount.objects.aggregate(
                total_debit=Sum('debit'),
                total_credit=Sum('credit'),
                total_final=Sum('final_total'),
                count=Count('id')
            )
            accounts_summary['income'] = {
                'name': 'Income Account',
                'total_debit': float(income['total_debit'] or 0),
                'total_credit': float(income['total_credit'] or 0),
                'total_final': float(income['total_final'] or 0),
                'count': income['count'],
                'color': 'emerald'
            }
            
            # Calculate overall totals
            total_debit = sum(account['total_debit'] for account in accounts_summary.values())
            total_credit = sum(account['total_credit'] for account in accounts_summary.values())
            total_final = sum(account['total_final'] for account in accounts_summary.values())
            total_count = sum(account['count'] for account in accounts_summary.values())
            
            return Response({
                'accounts': accounts_summary,
                'summary': {
                    'total_debit': total_debit,
                    'total_credit': total_credit,
                    'total_final': total_final,
                    'total_count': total_count
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch accounts summary: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
