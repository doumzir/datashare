import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TagInput from './TagInput';

describe('TagInput', () => {
  it('renders with placeholder when no tags', () => {
    render(<TagInput tags={[]} onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('Ajouter un tag...')).toBeInTheDocument();
  });

  it('adds a tag on Enter key', () => {
    const onChange = vi.fn();
    render(<TagInput tags={[]} onChange={onChange} />);
    const input = screen.getByPlaceholderText('Ajouter un tag...');
    fireEvent.change(input, { target: { value: 'photo' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(['photo']);
  });

  it('adds a tag on comma key', () => {
    const onChange = vi.fn();
    render(<TagInput tags={[]} onChange={onChange} />);
    const input = screen.getByPlaceholderText('Ajouter un tag...');
    fireEvent.change(input, { target: { value: 'work' } });
    fireEvent.keyDown(input, { key: ',' });
    expect(onChange).toHaveBeenCalledWith(['work']);
  });

  it('does not add duplicate tags', () => {
    const onChange = vi.fn();
    render(<TagInput tags={['photo']} onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'photo' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not add empty tags', () => {
    const onChange = vi.fn();
    render(<TagInput tags={[]} onChange={onChange} />);
    const input = screen.getByPlaceholderText('Ajouter un tag...');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('removes a tag on × click', () => {
    const onChange = vi.fn();
    render(<TagInput tags={['photo', 'work']} onChange={onChange} />);
    const removeButtons = screen.getAllByText('×');
    fireEvent.click(removeButtons[0]);
    expect(onChange).toHaveBeenCalledWith(['work']);
  });

  it('removes last tag on Backspace when input is empty', () => {
    const onChange = vi.fn();
    render(<TagInput tags={['photo', 'work']} onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Backspace' });
    expect(onChange).toHaveBeenCalledWith(['photo']);
  });

  it('displays existing tags', () => {
    render(<TagInput tags={['nature', 'travel']} onChange={vi.fn()} />);
    expect(screen.getByText('nature')).toBeInTheDocument();
    expect(screen.getByText('travel')).toBeInTheDocument();
  });
});
