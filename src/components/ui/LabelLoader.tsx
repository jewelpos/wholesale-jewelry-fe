const LabelLoader = ({
  label,
  loading,
  required,
}: {
  label: string;
  loading: boolean;
  required?: boolean;
}) => {
  return (
    <label>
      {label}{required && <span className="text-danger ms-1">*</span>}{" "}
      {loading && (
        <div className="spinner-grow spinner-grow-sm mr-3 me-1" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      )}
    </label>
  );
};

export default LabelLoader;
