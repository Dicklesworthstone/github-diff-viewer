import React from 'react';

export const Button = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <button
      className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${className}`}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = 'Button';