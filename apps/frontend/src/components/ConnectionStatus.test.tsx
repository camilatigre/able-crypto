import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConnectionStatus } from './ConnectionStatus';

describe('ConnectionStatus', () => {
  it('should render connected status', () => {
    render(<ConnectionStatus status="connected" />);
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('should render connecting status', () => {
    render(<ConnectionStatus status="connecting" />);
    expect(screen.getByText('Connecting...')).toBeInTheDocument();
  });

  it('should render reconnecting status', () => {
    render(<ConnectionStatus status="reconnecting" />);
    expect(screen.getByText('Reconnecting...')).toBeInTheDocument();
  });

  it('should render disconnected status', () => {
    render(<ConnectionStatus status="disconnected" />);
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  it('should render error status', () => {
    render(<ConnectionStatus status="error" />);
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('should render slow connection status', () => {
    render(<ConnectionStatus status="slow" />);
    expect(screen.getByText('Slow Connection')).toBeInTheDocument();
  });
});

