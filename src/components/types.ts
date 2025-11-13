export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonType = 'button' | 'submit' | 'reset';

export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'file' | 'date' | 'datetime-local';
export type InputSize = 'sm' | 'md' | 'lg';

export type TableVariant = 'striped' | 'bordered' | 'hover';

export type AlertVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'error';
export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BaseProps {
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  title?: string;
  colSpan?: number;
}

export interface ButtonProps extends BaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  type?: ButtonType;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
}

export interface InputProps extends BaseProps {
  type?: InputType;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  size?: InputSize;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  min?: string;
  max?: string;
  step?: string;
  id?: string;
  name?: string;
  icon?: React.ReactNode;
  maxLength?: number;
}

export interface TableProps extends BaseProps {
  variant?: TableVariant;
  striped?: boolean;
  bordered?: boolean;
  hover?: boolean;
}

export interface CardProps extends BaseProps {
  shadow?: 'sm' | 'md' | 'lg' | 'none';
  bordered?: boolean;
}

export interface AlertProps extends BaseProps {
  variant?: AlertVariant;
  dismissible?: boolean;
  onDismiss?: () => void;
  title?: string;
  message?: string;
}

export interface BadgeProps extends BaseProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
}

export interface ModalProps extends BaseProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
}

export interface TooltipProps extends BaseProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export interface SpinnerProps extends BaseProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'white';
}

export interface TextAreaProps extends InputProps {
  rows?: number;
  cols?: number;
}

export interface SelectProps extends BaseProps {
  options: Array<{ value: string; label: string }>;
  value?: string;
  defaultValue?: string;
  size?: InputSize;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  id?: string;
  name?: string;
}

export interface CheckboxProps extends BaseProps {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  onChange?: (checked: boolean) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

export interface RadioProps extends BaseProps {
  name: string;
  value: string;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

export interface DatePickerProps extends BaseProps {
  value?: string;
  defaultValue?: string;
  size?: InputSize;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

export interface FileInputProps extends BaseProps {
  accept?: string;
  multiple?: boolean;
  size?: InputSize;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  onChange?: (files: FileList | null) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

export interface GridProps extends BaseProps {
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'sm' | 'md' | 'lg';
}

export interface ColProps extends BaseProps {
  size?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
}

// Type aliases for simple components that don't need additional props
export type ContainerProps = BaseProps;
export type RowProps = BaseProps;