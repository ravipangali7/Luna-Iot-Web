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
    className={className}
  >
    <VisibilityIcon className="w-4 h-4" />
  </ActionButton>
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
    className={className}
  >
    <EditIcon className="w-4 h-4" />
  </ActionButton>
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
    className={className}
  >
    <DeleteIcon className="w-4 h-4" />
  </ActionButton>
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
    className={className}
  >
    <PlayArrowIcon className="w-4 h-4" />
  </ActionButton>
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
    className={className}
  >
    <PauseIcon className="w-4 h-4" />
  </ActionButton>
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
    className={className}
  >
    <AccountBalanceWalletIcon className="w-4 h-4" />
  </ActionButton>
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
    className={className}
  >
    <SendIcon className="w-4 h-4" />
  </ActionButton>
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
    className={className}
  >
    <PowerSettingsNewIcon className="w-4 h-4" />
  </ActionButton>
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
    className={className}
  >
    <PowerOffIcon className="w-4 h-4" />
  </ActionButton>
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
    className={className}
  >
    <AccountBalanceWalletIcon className="w-4 h-4" />
  </ActionButton>
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
