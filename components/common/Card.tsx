import React from 'react';

type CardProps<C extends React.ElementType> = {
  as?: C;
  children: React.ReactNode;
  className?: string;
} & React.ComponentPropsWithoutRef<C>;

const Card = <C extends React.ElementType = 'div'>({
  as,
  children,
  className = '',
  ...props
}: CardProps<C>) => {
  const Component = as || 'div';
  return (
    <Component className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 ${className}`} {...props}>
      {children}
    </Component>
  );
};

export default Card;
