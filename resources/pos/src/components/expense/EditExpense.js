import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { useParams } from 'react-router-dom';
import { fetchWarehouses } from '../../store/action/warehouseAction';
import MasterLayout from '../MasterLayout';
import ExpenseForm from './ExpenseForm';
import { fetchExpense } from '../../store/action/expenseAction';
import { fetchExpenseCategories } from '../../store/action/expenseCategoryAction';
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";

const EditExpense = (props) => {
    const { fetchExpense, expenses, warehouses, fetchExpenseCategories, expenseCategories, fetchWarehouses } = props;
    const { id } = useParams();

    useEffect(() => {
        fetchExpense(id);
        fetchWarehouses();
        fetchExpenseCategories();
    }, []);

    const itemsValue = expenses && expenses.length === 1 && expenses.map(expense => ({
        date: expense.attributes.date,
        title: expense.attributes.title,
        warehouse_id: {
            value: expense.attributes.warehouse_id,
            label: expense.attributes.warehouse_name
        },
        expense_category_id: {
            value: expense.attributes.expense_category_id,
            label: expense.attributes.expense_category_name,
        },
        amount: expense.attributes.amount,
        details: expense.attributes.details,
        id: expense.id,
    }));

    return (
        <MasterLayout>
            <TopProgressBar />
            {expenses && expenses.length === 1 && (
                <ExpenseForm 
                    singleExpense={itemsValue} 
                    id={id} 
                    warehouses={warehouses}
                    expenseCategories={expenseCategories}
                    isEdit={true}
                />
            )}
        </MasterLayout>
    );
};

const mapStateToProps = (state) => {
    const { expenses, warehouses, expenseCategories } = state;
    return { expenses, warehouses, expenseCategories };
};

export default connect(mapStateToProps, { fetchExpense, fetchWarehouses, fetchExpenseCategories })(EditExpense);
