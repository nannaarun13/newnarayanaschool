import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSchool } from '@/contexts/SchoolContext';
import { useToast } from '@/hooks/use-toast';
import PhoneInput from './PhoneInput';

const AdmissionForm = () => {
  const { dispatch } = useSchool();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    studentName: '',
    classApplied: '',
    previousClass: '',
    previousSchool: '',
    fatherName: '',
    motherName: '',
    primaryContact: '',
    secondaryContact: '',
    location: '',
    additionalInfo: ''
  });

  const classOptions = [
    'NURSERY',
    'LKG',
    'UKG',
    'CLASS 1',
    'CLASS 2',
    'CLASS 3',
    'CLASS 4',
    'CLASS 5',
    'CLASS 6',
    'CLASS 7',
    'CLASS 8',
    'CLASS 9',
    'CLASS 10'
  ];

  const getClassIndex = (className: string) => {
    return classOptions.indexOf(className);
  };

  const getAvailablePreviousClasses = () => {
    if (!formData.classApplied) return classOptions;
    
    const appliedIndex = getClassIndex(formData.classApplied);
    if (appliedIndex === -1) return classOptions;
    
    // Return classes from NURSERY to one class below the applied class
    // If applying for NURSERY, show NURSERY only
    // If applying for LKG, show NURSERY to LKG
    // If applying for CLASS 1, show NURSERY to UKG, etc.
    const maxIndex = appliedIndex === 0 ? 0 : appliedIndex - 1;
    return classOptions.slice(0, maxIndex + 1);
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // If starts with 91, remove it
    const cleanDigits = digits.startsWith('91') ? digits.slice(2) : digits;
    
    // Limit to 10 digits
    const limitedDigits = cleanDigits.slice(0, 10);
    
    // Format as 99999 99999
    if (limitedDigits.length <= 5) {
      return limitedDigits;
    } else {
      return `${limitedDigits.slice(0, 5)} ${limitedDigits.slice(5)}`;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (['studentName', 'fatherName', 'motherName', 'location', 'previousSchool'].includes(name)) {
      setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
    } else if (['primaryContact', 'secondaryContact'].includes(name)) {
      const formatted = formatPhoneNumber(value);
      setFormData(prev => ({ ...prev, [name]: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Reset previous class if class applied changes and current previous class is no longer valid
      if (name === 'classApplied' && prev.previousClass) {
        const appliedIndex = getClassIndex(value);
        const previousIndex = getClassIndex(prev.previousClass);
        
        // If previous class is equal to or higher than applied class, reset it
        if (previousIndex >= appliedIndex) {
          newData.previousClass = '';
        }
      }
      
      return newData;
    });
  };

  const validateForm = () => {
    if (!formData.previousClass || !formData.classApplied) {
      toast({
        title: "Validation Error",
        description: "Please select both class applied for and previous class.",
        variant: "destructive"
      });
      return false;
    }

    const previousIndex = getClassIndex(formData.previousClass);
    const appliedIndex = getClassIndex(formData.classApplied);
    
    if (previousIndex >= appliedIndex) {
      toast({
        title: "Validation Error",
        description: "Previous class must be lower than class applied for.",
        variant: "destructive"
      });
      return false;
    }

    if (formData.primaryContact.replace(/\s/g, '').length !== 10) {
      toast({
        title: "Validation Error",
        description: "Primary contact number must be exactly 10 digits.",
        variant: "destructive"
      });
      return false;
    }

    if (formData.secondaryContact && formData.secondaryContact.replace(/\s/g, '').length !== 10) {
      toast({
        title: "Validation Error",
        description: "Secondary contact number must be exactly 10 digits.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const inquiryData = {
      id: Date.now().toString(),
      ...formData,
      presentClass: formData.previousClass,
      primaryContact: `+91 ${formData.primaryContact}`,
      secondaryContact: formData.secondaryContact ? `+91 ${formData.secondaryContact}` : '',
      submittedAt: new Date().toISOString()
    };

    dispatch({ type: 'ADD_ADMISSION_INQUIRY', payload: inquiryData });
    
    toast({
      title: "Application Submitted",
      description: "Your admission inquiry has been submitted successfully. We will contact you soon.",
    });

    setFormData({
      studentName: '',
      classApplied: '',
      previousClass: '',
      previousSchool: '',
      fatherName: '',
      motherName: '',
      primaryContact: '',
      secondaryContact: '',
      location: '',
      additionalInfo: ''
    });
  };

  return (
    <section className="animate-fade-in">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="bg-school-blue text-white rounded-t-lg">
          <CardTitle className="text-2xl text-center">
            Admission Inquiry Form
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="studentName">Student Name *</Label>
                <Input
                  id="studentName"
                  name="studentName"
                  value={formData.studentName}
                  onChange={handleInputChange}
                  placeholder="Enter student name"
                  required
                  className="uppercase"
                />
                <p className="text-xs text-gray-500 mt-1">Automatically converted to uppercase</p>
              </div>
              
              <div>
                <Label htmlFor="classApplied">Class Applied For *</Label>
                <Select value={formData.classApplied} onValueChange={(value) => handleSelectChange('classApplied', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class applied for" />
                  </SelectTrigger>
                  <SelectContent>
                    {classOptions.map((className) => (
                      <SelectItem key={className} value={className}>
                        {className}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">Select the class you want to apply for</p>
              </div>
              
              <div>
                <Label htmlFor="previousClass">Previous Class *</Label>
                <Select value={formData.previousClass} onValueChange={(value) => handleSelectChange('previousClass', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select previous class" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailablePreviousClasses().map((className) => (
                      <SelectItem key={className} value={className}>
                        {className}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">Must be lower than class applied for</p>
              </div>
              
              <div>
                <Label htmlFor="previousSchool">Previous School</Label>
                <Input
                  id="previousSchool"
                  name="previousSchool"
                  value={formData.previousSchool}
                  onChange={handleInputChange}
                  placeholder="Enter previous school name"
                  className="uppercase"
                />
                <p className="text-xs text-gray-500 mt-1">Optional, automatically converted to uppercase</p>
              </div>
              
              <div>
                <Label htmlFor="fatherName">Father's Name *</Label>
                <Input
                  id="fatherName"
                  name="fatherName"
                  value={formData.fatherName}
                  onChange={handleInputChange}
                  placeholder="Enter father's name"
                  required
                  className="uppercase"
                />
                <p className="text-xs text-gray-500 mt-1">Automatically converted to uppercase</p>
              </div>
              
              <div>
                <Label htmlFor="motherName">Mother's Name *</Label>
                <Input
                  id="motherName"
                  name="motherName"
                  value={formData.motherName}
                  onChange={handleInputChange}
                  placeholder="Enter mother's name"
                  required
                  className="uppercase"
                />
                <p className="text-xs text-gray-500 mt-1">Automatically converted to uppercase</p>
              </div>
              
              <PhoneInput
                id="primaryContact"
                name="primaryContact"
                value={formData.primaryContact}
                onChange={handleInputChange}
                label="Primary Contact Number"
                required
              />
              
              <PhoneInput
                id="secondaryContact"
                name="secondaryContact"
                value={formData.secondaryContact}
                onChange={handleInputChange}
                label="Secondary Contact Number"
              />
              
              <div className="md:col-span-2">
                <Label htmlFor="location">Location/Address *</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Enter your location/address"
                  required
                  className="uppercase"
                />
                <p className="text-xs text-gray-500 mt-1">Automatically converted to uppercase</p>
              </div>
            </div>
            
            <div>
              <Label htmlFor="additionalInfo">Additional Information</Label>
              <Textarea
                id="additionalInfo"
                name="additionalInfo"
                value={formData.additionalInfo}
                onChange={handleInputChange}
                rows={4}
                placeholder="Any additional information you'd like to share"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-school-blue hover:bg-school-blue/90 text-white py-3 text-lg"
            >
              Submit Admission Inquiry
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
};

export default AdmissionForm;
