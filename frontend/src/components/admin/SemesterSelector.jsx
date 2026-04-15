import PropTypes from 'prop-types';

/**
 * Reusable semester selector dropdown component
 * Used across admin panels for selecting semesters
 */
function SemesterSelector({
  semesters = [],
  selectedSemesterId,
  onSemesterChange,
  label = "Select Semester",
  className = ""
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-semibold text-muted uppercase mb-2">
        {label}
      </label>
      <select
        value={selectedSemesterId || ""}
        onChange={(e) => onSemesterChange(e.target.value ? Number(e.target.value) : null)}
        className="w-full max-w-md px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-text focus:ring-2 focus:ring-primary focus:border-transparent"
      >
        <option value="">-- Select a semester --</option>
        {semesters.map((semester) => (
          <option key={semester.id} value={semester.id}>
            {semester.name} {semester.is_active ? "(Active)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

SemesterSelector.propTypes = {
  semesters: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      is_active: PropTypes.bool,
    })
  ).isRequired,
  selectedSemesterId: PropTypes.number,
  onSemesterChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  className: PropTypes.string,
};

export default SemesterSelector;
