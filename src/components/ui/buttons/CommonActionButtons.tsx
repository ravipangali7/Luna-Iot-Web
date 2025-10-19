import React from 'react';
import ActionButton from './ActionButton';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SendIcon from '@mui/icons-material/Send';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import PowerOffIcon from '@mui/icons-material/PowerOff';

interface CommonActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  title?: string;
}

// View Action Button - Info variant, eye icon
export const ViewActionButton: React.FC<CommonActionButtonProps> = ({
  onClick,
  disabled = false,
  loading = false,
  className = ''
}) => (
  <ActionButton
    onClick={onClick}
    variant="info"
    size="sm"
    disabled={disabled}
    loading={loading}
    title="View Details"
    icon={<VisibilityIcon className="w-4 h-4" />}
    className={className}
  />
);

// Edit Action Button - Warning variant, edit icon
export const EditActionButton: React.FC<CommonActionButtonProps> = ({
  onClick,
  disabled = false,
  loading = false,
  className = ''
}) => (
  <ActionButton
    onClick={onClick}
    variant="warning"
    size="sm"
    disabled={disabled}
    loading={loading}
    title="Edit"
    icon={<EditIcon className="w-4 h-4" />}
    className={className}
  />
);

// Delete Action Button - Danger variant, delete icon
export const DeleteActionButton: React.FC<CommonActionButtonProps> = ({
  onClick,
  disabled = false,
  loading = false,
  className = ''
}) => (
  <ActionButton
    onClick={onClick}
    variant="danger"
    size="sm"
    disabled={disabled}
    loading={loading}
    title="Delete"
    icon={<DeleteIcon className="w-4 h-4" />}
    className={className}
  />
);

// Activate Action Button - Success variant, play icon
export const ActivateActionButton: React.FC<CommonActionButtonProps> = ({
  onClick,
  disabled = false,
  loading = false,
  className = ''
}) => (
  <ActionButton
    onClick={onClick}
    variant="success"
    size="sm"
    disabled={disabled}
    loading={loading}
    title="Activate"
    icon={<PlayArrowIcon className="w-4 h-4" />}
    className={className}
  />
);

// Deactivate Action Button - Warning variant, pause icon
export const DeactivateActionButton: React.FC<CommonActionButtonProps> = ({
  onClick,
  disabled = false,
  loading = false,
  className = ''
}) => (
  <ActionButton
    onClick={onClick}
    variant="warning"
    size="sm"
    disabled={disabled}
    loading={loading}
    title="Deactivate"
    icon={<PauseIcon className="w-4 h-4" />}
    className={className}
  />
);

// Recharge Action Button - Primary variant, wallet icon
export const RechargeActionButton: React.FC<CommonActionButtonProps> = ({
  onClick,
  disabled = false,
  loading = false,
  className = ''
}) => (
  <ActionButton
    onClick={onClick}
    variant="primary"
    size="sm"
    disabled={disabled}
    loading={loading}
    title="Recharge"
    icon={<AccountBalanceWalletIcon className="w-4 h-4" />}
    className={className}
  />
);

// Commands Action Button - Secondary variant, send icon
export const CommandsActionButton: React.FC<CommonActionButtonProps> = ({
  onClick,
  disabled = false,
  loading = false,
  className = ''
}) => (
  <ActionButton
    onClick={onClick}
    variant="secondary"
    size="sm"
    disabled={disabled}
    loading={loading}
    title="Commands"
    icon={<SendIcon className="w-4 h-4" />}
    className={className}
  />
);

// Relay On Action Button - Success variant, power on icon
export const RelayOnActionButton: React.FC<CommonActionButtonProps> = ({
  onClick,
  disabled = false,
  loading = false,
  className = ''
}) => (
  <ActionButton
    onClick={onClick}
    variant="success"
    size="sm"
    disabled={disabled}
    loading={loading}
    title="Turn Relay ON"
    icon={<PowerSettingsNewIcon className="w-4 h-4" />}
    className={className}
  />
);

// Relay Off Action Button - Warning variant, power off icon
export const RelayOffActionButton: React.FC<CommonActionButtonProps> = ({
  onClick,
  disabled = false,
  loading = false,
  className = ''
}) => (
  <ActionButton
    onClick={onClick}
    variant="warning"
    size="sm"
    disabled={disabled}
    loading={loading}
    title="Turn Relay OFF"
    icon={<PowerOffIcon className="w-4 h-4" />}
    className={className}
  />
);

// Top Up Action Button - Success variant, wallet icon
export const TopUpActionButton: React.FC<CommonActionButtonProps> = ({
  onClick,
  disabled = false,
  loading = false,
  className = ''
}) => (
  <ActionButton
    onClick={onClick}
    variant="success"
    size="sm"
    disabled={disabled}
    loading={loading}
    title="Top Up Wallet"
    icon={<AccountBalanceWalletIcon className="w-4 h-4" />}
    className={className}
  />
);

// Action Button Group - Container for multiple action buttons
interface ActionButtonGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const ActionButtonGroup: React.FC<ActionButtonGroupProps> = ({
  children,
  className = ''
}) => (
  <div className={`flex justify-end gap-2 ${className}`}>
    {children}
  </div>
);
