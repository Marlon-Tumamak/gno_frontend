from rest_framework import serializers
from .models import (
    RepairAndMaintenanceAccount, InsuranceAccount, FuelAccount, TaxAccount, 
    AllowanceAccount, IncomeAccount, TruckingAccount, SalaryAccount, TruckType, AccountType, PlateNumber
)

class TruckTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TruckType
        fields = ['id', 'name']
        read_only_fields = ['id']

class AccountTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccountType
        fields = ['id', 'name']
        read_only_fields = ['id']

class PlateNumberSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlateNumber
        fields = ['id', 'number']
        read_only_fields = ['id']

class RepairAndMaintenanceAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = RepairAndMaintenanceAccount
        fields = [
            'id', 'account_number', 'account_type', 'truck_type', 'plate_number',
            'description', 'debit', 'credit', 'final_total', 'remarks',
            'reference_number', 'date'
        ]
        read_only_fields = ['id']

class InsuranceAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = InsuranceAccount
        fields = [
            'id', 'account_number', 'account_type', 'truck_type', 'plate_number',
            'description', 'debit', 'credit', 'final_total', 'remarks',
            'reference_number', 'date', 'unit_cost'
        ]
        read_only_fields = ['id']

class FuelAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = FuelAccount
        fields = [
            'id', 'account', 'account_type', 'truck_type', 'plate_number',
            'description', 'debit', 'credit', 'final_total', 'remarks',
            'reference_number', 'date', 'liters', 'price', 'driver', 'route',
            'front_load', 'back_load'
        ]
        read_only_fields = ['id']

class TaxAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaxAccount
        fields = [
            'id', 'account_number', 'account_type', 'truck_type', 'plate_number',
            'description', 'debit', 'credit', 'final_total', 'remarks',
            'reference_number', 'date', 'price', 'quantity'
        ]
        read_only_fields = ['id']

class AllowanceAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = AllowanceAccount
        fields = [
            'id', 'account_number', 'account_type', 'truck_type', 'plate_number',
            'description', 'debit', 'credit', 'final_total', 'remarks',
            'reference_number', 'date'
        ]
        read_only_fields = ['id']

class IncomeAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = IncomeAccount
        fields = [
            'id', 'account_number', 'account_type', 'truck_type', 'plate_number',
            'description', 'debit', 'credit', 'final_total', 'remarks',
            'reference_number', 'date', 'driver', 'route', 'quantity', 'price',
            'front_load', 'back_load'
        ]
        read_only_fields = ['id']

class TruckingAccountSerializer(serializers.ModelSerializer):
    date = serializers.DateField(format='%m/%d/%Y', input_formats=['%m/%d/%Y', '%Y-%m-%d'])
    
    class Meta:
        model = TruckingAccount
        fields = [
            'id',
            'account_number',
            'account_type',
            'truck_type',
            'plate_number',
            'description',
            'debit',
            'credit',
            'final_total',
            'remarks',
            'reference_number',
            'date',
            'quantity',
            'price',
            'driver',
            'route',
            'front_load',
            'back_load',
        ]
        read_only_fields = ['id']


class SalaryAccountSerializer(serializers.ModelSerializer):
    date = serializers.DateField(format='%m/%d/%Y', input_formats=['%m/%d/%Y', '%Y-%m-%d'])
    
    class Meta:
        model = SalaryAccount
        fields = [
            'id',
            'account_number',
            'account_type',
            'truck_type',
            'plate_number',
            'description',
            'debit',
            'credit',
            'final_total',
            'remarks',
            'reference_number',
            'date',
            'quantity',
            'price',
            'driver',
            'route',
            'front_load',
            'back_load',
        ]
        read_only_fields = ['id']
