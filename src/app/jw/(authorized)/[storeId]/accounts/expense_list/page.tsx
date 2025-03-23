import ExpenseListComponent from "@/components/ui/accounts/expenseList/ExpenseListComponent";
import PageHeader from "@/components/ui/PageHeader";

const ExpenseList = () => {
  return (
    <div>
      <div className="page-wrapper ">
        <div className="content">
          <PageHeader showBreadcrumb />
          <div className="card table-list-card">
            <ExpenseListComponent />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseList;
