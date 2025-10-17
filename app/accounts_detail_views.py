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


class AccountsDetailView(APIView):
    """
    GET: Get detailed entries for all account types
    """
    
    def get(self, request):
        try:
            # Get all entries for each account type
            accounts_detail = {}
            
            # Repair and Maintenance Accounts
            repair_maintenance_entries = RepairAndMaintenanceAccount.objects.select_related(
                'truck_type', 'account_type', 'plate_number'
            ).all()
            
            accounts_detail['repair_maintenance'] = {
                'name': 'Repair & Maintenance',
                'entries': []
            }
            
            for entry in repair_maintenance_entries:
                accounts_detail['repair_maintenance']['entries'].append({
                    'id': entry.id,
                    'account_number': entry.account_number,
                    'truck_type': entry.truck_type.name,
                    'account_type': entry.account_type.name,
                    'plate_number': entry.plate_number.number,
                    'debit': float(entry.debit),
                    'credit': float(entry.credit),
                    'final_total': float(entry.final_total),
                    'reference_number': entry.reference_number,
                    'date': entry.date.strftime('%Y-%m-%d'),
                    'description': entry.description,
                    'remarks': entry.remarks
                })
            
            # Insurance Accounts
            insurance_entries = InsuranceAccount.objects.select_related(
                'truck_type', 'account_type', 'plate_number'
            ).all()
            
            accounts_detail['insurance'] = {
                'name': 'Insurance',
                'entries': []
            }
            
            for entry in insurance_entries:
                accounts_detail['insurance']['entries'].append({
                    'id': entry.id,
                    'account_number': entry.account_number,
                    'truck_type': entry.truck_type.name,
                    'account_type': entry.account_type.name,
                    'plate_number': entry.plate_number.number,
                    'debit': float(entry.debit),
                    'credit': float(entry.credit),
                    'final_total': float(entry.final_total),
                    'reference_number': entry.reference_number,
                    'date': entry.date.strftime('%Y-%m-%d'),
                    'description': entry.description,
                    'remarks': entry.remarks
                })
            
            # Fuel Accounts
            fuel_entries = FuelAccount.objects.select_related(
                'truck_type', 'account_type', 'plate_number'
            ).all()
            
            accounts_detail['fuel'] = {
                'name': 'Fuel & Oil',
                'entries': []
            }
            
            for entry in fuel_entries:
                accounts_detail['fuel']['entries'].append({
                    'id': entry.id,
                    'account_number': entry.account_number,
                    'truck_type': entry.truck_type.name,
                    'account_type': entry.account_type.name,
                    'plate_number': entry.plate_number.number,
                    'debit': float(entry.debit),
                    'credit': float(entry.credit),
                    'final_total': float(entry.final_total),
                    'reference_number': entry.reference_number,
                    'date': entry.date.strftime('%Y-%m-%d'),
                    'description': entry.description,
                    'remarks': entry.remarks,
                    'driver': entry.driver,
                    'route': entry.route,
                    'liters': float(entry.liters) if entry.liters else 0,
                    'price': float(entry.price) if entry.price else 0,
                    'front_load': entry.front_load,
                    'back_load': entry.back_load
                })
            
            # Tax Accounts
            tax_entries = TaxAccount.objects.select_related(
                'truck_type', 'account_type', 'plate_number'
            ).all()
            
            accounts_detail['tax'] = {
                'name': 'Tax Account',
                'entries': []
            }
            
            for entry in tax_entries:
                accounts_detail['tax']['entries'].append({
                    'id': entry.id,
                    'account_number': entry.account_number,
                    'truck_type': entry.truck_type.name,
                    'account_type': entry.account_type.name,
                    'plate_number': entry.plate_number.number,
                    'debit': float(entry.debit),
                    'credit': float(entry.credit),
                    'final_total': float(entry.final_total),
                    'reference_number': entry.reference_number,
                    'date': entry.date.strftime('%Y-%m-%d'),
                    'description': entry.description,
                    'remarks': entry.remarks,
                    'price': float(entry.price) if entry.price else 0,
                    'quantity': float(entry.quantity) if entry.quantity else 0
                })
            
            # Allowance Accounts
            allowance_entries = AllowanceAccount.objects.select_related(
                'truck_type', 'account_type', 'plate_number'
            ).all()
            
            accounts_detail['allowance'] = {
                'name': 'Allowance Account',
                'entries': []
            }
            
            for entry in allowance_entries:
                accounts_detail['allowance']['entries'].append({
                    'id': entry.id,
                    'account_number': entry.account_number,
                    'truck_type': entry.truck_type.name,
                    'account_type': entry.account_type.name,
                    'plate_number': entry.plate_number.number,
                    'debit': float(entry.debit),
                    'credit': float(entry.credit),
                    'final_total': float(entry.final_total),
                    'reference_number': entry.reference_number,
                    'date': entry.date.strftime('%Y-%m-%d'),
                    'description': entry.description,
                    'remarks': entry.remarks
                })
            
            # Income Accounts
            income_entries = IncomeAccount.objects.select_related(
                'truck_type', 'account_type', 'plate_number'
            ).all()
            
            accounts_detail['income'] = {
                'name': 'Income Account',
                'entries': []
            }
            
            for entry in income_entries:
                accounts_detail['income']['entries'].append({
                    'id': entry.id,
                    'account_number': entry.account_number,
                    'truck_type': entry.truck_type.name,
                    'account_type': entry.account_type.name,
                    'plate_number': entry.plate_number.number,
                    'debit': float(entry.debit),
                    'credit': float(entry.credit),
                    'final_total': float(entry.final_total),
                    'reference_number': entry.reference_number,
                    'date': entry.date.strftime('%Y-%m-%d'),
                    'description': entry.description,
                    'remarks': entry.remarks,
                    'driver': entry.driver,
                    'route': entry.route,
                    'quantity': float(entry.quantity),
                    'price': float(entry.price),
                    'front_load': entry.front_load,
                    'back_load': entry.back_load
                })
            
            return Response({
                'accounts': accounts_detail
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch accounts detail: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )




