import React from 'react';
import { Button } from '@/components/ui/button';

interface NavButtonProps {
  icon: string;
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: 'nav' | 'navSuccess' | 'navMuted';
  className?: string;
}

const NavButton: React.FC<NavButtonProps> = ({ 
  icon, 
  label, 
  onClick, 
  href,
  variant = 'nav',
  className = ''
}) => {
  const content = (
    <>
      <span className="text-xl">{icon}</span>
      <span>{label}</span>
    </>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block">
        <Button variant={variant} className={className}>
          {content}
        </Button>
      </a>
    );
  }

  return (
    <Button variant={variant} onClick={onClick} className={className}>
      {content}
    </Button>
  );
};

export default NavButton;
