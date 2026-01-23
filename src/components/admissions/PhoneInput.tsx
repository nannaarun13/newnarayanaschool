import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChangeEvent } from 'react';

interface PhoneInputProps {
  id: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  label: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

const PhoneInput = ({ 
  id, 
  name, 
  value, 
  onChange, 
  label, 
  required = false, 
  placeholder = "9848047368",
  disabled = false,
  error
}: PhoneInputProps) => {

  // Handler to enforce numeric input only
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Only allow digits (0-9)
    const numericValue = input.replace(/\D/g, '');
    
    // Update the event target value before passing to parent
    e.target.value = numericValue;
    onChange(e);
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className={error ? "text-red-500" : ""}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      
      <div className="flex group">
        {/* Country Code Prefix */}
        <span className="inline-flex items-center px-3 text-sm font-medium text-gray-900 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md select-none">
          🇮🇳 +91
        </span>
        
        {/* Phone Input */}
        <Input
          id={id}
          name={name}
          type="tel" // Triggers numeric keypad on mobile
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`rounded-l-none ${error ? "border-red-500 focus-visible:ring-red-500" : ""}`}
          maxLength={10} // Strict 10-digit limit for Indian numbers
          pattern="[0-9]{10}" // HTML5 validation pattern
          autoComplete="tel"
        />
      </div>

      {/* Helper Text or Error Message */}
      {error ? (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      ) : (
        <p className="text-xs text-gray-500 mt-1">
          {required ? "Enter 10-digit mobile number" : "Optional"}
        </p>
      )}
    </div>
  );
};

export default PhoneInput;