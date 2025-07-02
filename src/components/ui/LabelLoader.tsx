const LabelLoader = ({
  label,
  loading,
}: {
  label: string;
  loading: boolean;
}) => {
  return (
    <label>
      {label}{" "}
      {loading && (
        <div className="spinner-grow spinner-grow-sm mr-3 me-1" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      )}
    </label>
  );
};

export default LabelLoader;
