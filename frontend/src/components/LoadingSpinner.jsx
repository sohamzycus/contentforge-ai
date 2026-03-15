function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in">
      <div className="relative">
        <div className="w-14 h-14 rounded-full border-[3px] border-surface-200" />
        <div className="absolute inset-0 w-14 h-14 rounded-full border-[3px] border-transparent border-t-brand-500 animate-spin" />
      </div>
      <p className="mt-5 text-sm font-medium text-gray-500 max-w-xs text-center">{message}</p>
    </div>
  );
}

export default LoadingSpinner;
