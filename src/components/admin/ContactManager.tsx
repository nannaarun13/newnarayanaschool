
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSchool } from '@/contexts/SchoolContext';
import { useToast } from '@/hooks/use-toast';
import { Save, Plus, Trash2 } from 'lucide-react';
import { updateSchoolData } from '@/utils/schoolDataUtils';

const ContactManager = () => {
  const { state, dispatch } = useSchool();
  const { toast } = useToast();
  
  const safeContactInfo = {
    address: state.data.contactInfo?.address || '',
    email: state.data.contactInfo?.email || '',
    phone: state.data.contactInfo?.phone || '',
    contactNumbers: state.data.contactInfo?.contactNumbers || [],
    mapEmbed: state.data.contactInfo?.mapEmbed || '',
    location: state.data.contactInfo?.location || { latitude: 17.3092, longitude: 78.5095 }
  };
  
  const [contactData, setContactData] = useState(safeContactInfo);
  const [newContactNumber, setNewContactNumber] = useState('');

  const extractMapUrl = (input: string): string => {
    // If it's already a URL, return as is
    if (input.startsWith('https://') || input.startsWith('http://')) {
      return input.trim();
    }
    // Extract src from iframe embed code
    const srcMatch = input.match(/src=["']([^"']+)["']/);
    if (srcMatch && srcMatch[1]) {
      return srcMatch[1];
    }
    return input.trim();
  };

  // Convert URL to proper embed format for preview (no API key needed)
  const getPreviewUrl = (url: string): string => {
    if (!url) return '';
    
    // Already a proper embed URL
    if (url.includes('output=embed')) {
      return url;
    }
    
    // Extract query and create embed format
    const qMatch = url.match(/[?&]q=([^&]+)/);
    if (qMatch && qMatch[1]) {
      const query = qMatch[1];
      return `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    }
    
    // Return as-is if we can't parse it
    return url;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'mapEmbed') {
      setContactData(prev => ({ ...prev, [name]: extractMapUrl(value) }));
    } else {
      setContactData(prev => ({ ...prev, [name]: value }));
    }
  };

  const addContactNumber = () => {
    if (newContactNumber.trim() && contactData.contactNumbers.length < 5) {
      let formattedNumber = newContactNumber.trim();
      
      // Add +91 prefix if not present and it's a 10-digit number
      if (!formattedNumber.startsWith('+') && formattedNumber.length === 10) {
        formattedNumber = `+91 ${formattedNumber}`;
      } else if (!formattedNumber.startsWith('+91') && formattedNumber.length === 10) {
        formattedNumber = `+91 ${formattedNumber}`;
      }
      
      const contactNumber = {
        id: Date.now().toString(),
        label: `Phone ${contactData.contactNumbers.length + 1}`,
        number: formattedNumber
      };
      
      const updatedContactData = {
        ...contactData,
        contactNumbers: [...contactData.contactNumbers, contactNumber]
      };
      
      setContactData(updatedContactData);
      setNewContactNumber('');
      
      toast({
        title: "Phone Number Added",
        description: "New phone number has been added.",
      });
    }
  };

  const deleteContactNumber = (id: string) => {
    const updatedContactData = {
      ...contactData,
      contactNumbers: contactData.contactNumbers.filter(contact => contact.id !== id)
    };
    setContactData(updatedContactData);
    
    toast({
      title: "Phone Number Deleted",
      description: "Phone number has been removed.",
    });
  };

  const handleSave = async () => {
    console.log('Saving contact information...');
    
    // Update local state first
    dispatch({
      type: 'UPDATE_SCHOOL_DATA',
      payload: { contactInfo: contactData }
    });
    
    // Try to save to Firestore
    try {
      await updateSchoolData({ contactInfo: contactData });
      console.log('Contact info saved to Firestore successfully');
      
      toast({
        title: "Contact Information Updated",
        description: "Contact details have been updated successfully.",
      });
    } catch (error: any) {
      console.error('Failed to save contact info to Firestore:', error);
      
      if (error.code === 'permission-denied') {
        toast({
          title: "Contact Updated Locally",
          description: "Contact information updated locally. Database permissions need configuration for persistence.",
          variant: "default",
        });
      } else {
        toast({
          title: "Partial Save",
          description: "Contact updated locally but couldn't sync to database.",
          variant: "default",
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Contact Management</h2>
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="address" className="text-sm font-medium text-gray-700">School Address</Label>
            <Textarea
              id="address"
              name="address"
              value={contactData.address}
              onChange={handleInputChange}
              rows={3}
              className="mt-1"
              placeholder="Enter school address"
            />
          </div>
          
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={contactData.email}
              onChange={handleInputChange}
              className="mt-1"
              placeholder="Enter email address"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">Phone Numbers</Label>
            <div className="mt-2 space-y-3">
              {contactData.contactNumbers.map((contact) => (
                <div key={contact.id} className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                  <span className="flex-1 font-medium">{contact.number}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteContactNumber(contact.id)}
                    className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {contactData.contactNumbers.length < 5 && (
              <div className="mt-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter phone number"
                    value={newContactNumber}
                    onChange={(e) => setNewContactNumber(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={addContactNumber} 
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Phone
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">You can add up to 5 phone numbers</p>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="mapEmbed" className="text-sm font-medium text-gray-700">Google Maps Embed</Label>
            <Textarea
              id="mapEmbed"
              name="mapEmbed"
              value={contactData.mapEmbed}
              onChange={handleInputChange}
              rows={4}
              className="mt-1"
              placeholder="Paste the full iframe embed code or just the src URL from Google Maps"
            />
            <p className="text-xs text-gray-500 mt-1">
              Go to Google Maps → Share → Embed a map → Copy the full iframe code and paste it here
            </p>
            {contactData.mapEmbed && (
              <div className="mt-4">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Preview</Label>
                <div className="h-48 rounded-lg overflow-hidden border">
                  <iframe 
                    className="w-full h-full border-0"
                    src={getPreviewUrl(contactData.mapEmbed)}
                    title="Map Preview"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactManager;
