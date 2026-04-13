import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { 
  LoadingSpinner, 
  ErrorMessage, 
  EmptyState, 
  StatCard, 
  Badge, 
  PageHeader, 
  Card, 
  Button, 
  Modal, 
  Input, 
  Select, 
  Textarea, 
  ChartDonut 
} from './UI';

describe('UI Shared Components', () => {
  
  describe('LoadingSpinner', () => {
    it('renders with different sizes', () => {
      const { container: sm } = render(<LoadingSpinner size="sm" />);
      expect(sm.firstChild?.firstChild).toHaveClass('w-6 h-6');
      
      const { container: md } = render(<LoadingSpinner size="md" />);
      expect(md.firstChild?.firstChild).toHaveClass('w-10 h-10');
      
      const { container: lg } = render(<LoadingSpinner size="lg" />);
      expect(lg.firstChild?.firstChild).toHaveClass('w-16 h-16');
      
      const { container: def } = render(<LoadingSpinner />);
      expect(def.firstChild?.firstChild).toHaveClass('w-10 h-10');
    });
  });

  describe('ErrorMessage', () => {
    it('renders message and calls onRetry', () => {
      const onRetry = vi.fn();
      render(<ErrorMessage message="Fail" onRetry={onRetry} />);
      expect(screen.getByText('Fail')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Try Again'));
      expect(onRetry).toHaveBeenCalled();
    });

    it('renders without retry button', () => {
      render(<ErrorMessage message="Fail" />);
      expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
    });
  });

  describe('EmptyState', () => {
    it('renders all parts', () => {
      const Icon = () => <span data-testid="icon">I</span>;
      render(
        <EmptyState 
          icon={Icon} 
          title="T" 
          description="D" 
          action={<button>Act</button>} 
        />
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByText('T')).toBeInTheDocument();
      expect(screen.getByText('D')).toBeInTheDocument();
      expect(screen.getByText('Act')).toBeInTheDocument();
    });

    it('renders with subtitle fallback', () => {
      render(<EmptyState title="T" subtitle="S" />);
      expect(screen.getByText('S')).toBeInTheDocument();
    });
  });

  describe('StatCard', () => {
    it('renders label, value and trend', () => {
      const Icon = () => <span>I</span>;
      render(<StatCard icon={Icon} label="L" value="V" color="red" trend="+10%" />);
      expect(screen.getByText('L')).toBeInTheDocument();
      expect(screen.getByText('V')).toBeInTheDocument();
      expect(screen.getByText('+10%')).toBeInTheDocument();
    });
  });

  describe('Badge', () => {
    it('renders correct status colors', () => {
      render(<Badge status="ACTIVE" />);
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
      
      render(<Badge status="PENDING_CANCELLATION" />);
      expect(screen.getByText('PENDING CANCELLATION')).toBeInTheDocument();

      render(<Badge status="NON_EXISTENT" />);
      expect(screen.getByText('NON EXISTENT')).toBeInTheDocument();

      render(<Badge />);
      expect(screen.getByText('UNKNOWN')).toBeInTheDocument();
    });
  });

  describe('PageHeader', () => {
    it('renders title and subtitle', () => {
      render(<PageHeader title="T" subtitle="S" action={<span>A</span>} />);
      expect(screen.getByText('T')).toBeInTheDocument();
      expect(screen.getByText('S')).toBeInTheDocument();
      expect(screen.getByText('A')).toBeInTheDocument();
    });
  });

  describe('Card', () => {
    it('calls onClick and applies hoverable class', () => {
      const onClick = vi.fn();
      const { container } = render(<Card onClick={onClick} hoverable>C</Card>);
      expect(container.firstChild).toHaveClass('cursor-pointer');
      fireEvent.click(screen.getByText('C'));
      expect(onClick).toHaveBeenCalled();
    });

    it('renders without hoverable class', () => {
      const { container } = render(<Card>C</Card>);
      expect(container.firstChild).toHaveClass('shadow-sm');
    });
  });

  describe('Button', () => {
    it('renders variants and handles loading/disabled', () => {
      const onClick = vi.fn();
      const { rerender } = render(<Button onClick={onClick} variant="danger">B</Button>);
      fireEvent.click(screen.getByText('B'));
      expect(onClick).toHaveBeenCalled();

      rerender(<Button loading>B</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
      
      rerender(<Button variant="outline" size="sm">B</Button>);
      expect(screen.getByRole('button')).toHaveClass('px-3');
    });
  });

  describe('Modal', () => {
    it('renders when open and handles close', () => {
      const onClose = vi.fn();
      const { rerender } = render(<Modal isOpen={false} onClose={onClose} title="M">C</Modal>);
      expect(screen.queryByText('M')).not.toBeInTheDocument();

      rerender(<Modal isOpen={true} onClose={onClose} title="M">C</Modal>);
      expect(screen.getByText('M')).toBeInTheDocument();
      expect(screen.getByText('C')).toBeInTheDocument();

      fireEvent.click(screen.getByText('✕'));
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Form Inputs', () => {
    it('renders Input with labels and errors', () => {
      render(<Input label="Input Label" error="E" defaultValue="V" />);
      expect(screen.getByLabelText('Input Label')).toHaveValue('V');
      expect(screen.getByText('E')).toBeInTheDocument();
    });

    it('renders Input with specific id and without label', () => {
      render(<Input id="test-id" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'test-id');
      
      const { container } = render(<Input />);
      expect(container.querySelector('input')).not.toHaveAttribute('id');
    });

    it('renders Select with options', () => {
      render(
        <Select label="Select Label" error="E">
          <option value="1">O1</option>
        </Select>
      );
      expect(screen.getByLabelText('Select Label')).toBeInTheDocument();
      expect(screen.getByText('O1')).toBeInTheDocument();
      expect(screen.getByText('E')).toBeInTheDocument();

      const { container } = render(<Select />);
      expect(container.querySelector('select')).not.toHaveAttribute('id');
    });

    it('renders Textarea', () => {
      render(<Textarea label="Area Label" error="E" />);
      expect(screen.getByLabelText('Area Label')).toBeInTheDocument();
      expect(screen.getByText('E')).toBeInTheDocument();

      const { container } = render(<Textarea />);
      expect(container.querySelector('textarea')).not.toHaveAttribute('id');
    });
  });

  describe('ChartDonut', () => {
    it('renders with data and covers missing status branch', () => {
      const data = [{ status: 'ACTIVE' }, { status: 'EXPIRED' }, { status: null }]; // status null branch
      const { container } = render(<ChartDonut data={data} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
      expect(container.querySelectorAll('circle').length).toBe(3);
    });

    it('renders with empty data', () => {
      const { container } = render(<ChartDonut data={[]} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

});
