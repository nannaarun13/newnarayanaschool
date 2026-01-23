
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Users, Calendar, TrendingUp, Download } from 'lucide-react';
import { useSchool } from '@/contexts/SchoolContext';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

const AdmissionManager = () => {
  const { state } = useSchool();
  const { toast } = useToast();
  const [monthlyData, setMonthlyData] = useState<{[key: string]: number}>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Calculate monthly inquiry counts
    const inquiries = state.admissionInquiries || [];
    const monthly: {[key: string]: number} = {};
    
    inquiries.forEach(inquiry => {
      if (inquiry.submittedAt) {
        const date = new Date(inquiry.submittedAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthly[monthKey] = (monthly[monthKey] || 0) + 1;
      }
    });
    
    setMonthlyData(monthly);
    console.log("Admission inquiries loaded:", inquiries.length);
  }, [state.admissionInquiries]);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthCount = monthlyData[currentMonth] || 0;
  const totalInquiries = state.admissionInquiries?.length || 0;

  const handleExport = () => {
    setLoading(true);
    try {
      // Create CSV content
      const headers = ['Student Name', 'Class Applied', 'Previous Class', 'Previous School', 
                      'Father Name', 'Mother Name', 'Primary Contact', 'Secondary Contact', 
                      'Location', 'Additional Info', 'Submitted Date'];
      
      const csvContent = [
        headers.join(','),
        ...(state.admissionInquiries || []).map(inquiry => [
          `"${inquiry.studentName || ''}"`,
          `"${inquiry.classApplied || ''}"`,
          `"${inquiry.previousClass || inquiry.presentClass || ''}"`,
          `"${inquiry.previousSchool || ''}"`,
          `"${inquiry.fatherName || ''}"`,
          `"${inquiry.motherName || ''}"`,
          `"${inquiry.primaryContact || ''}"`,
          `"${inquiry.secondaryContact || ''}"`,
          `"${inquiry.location || ''}"`,
          `"${inquiry.additionalInfo || ''}"`,
          `"${new Date(inquiry.submittedAt || '').toLocaleDateString()}"`
        ].join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `admission-inquiries-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "Admission inquiries exported successfully.",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting the data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getMonthlyStats = () => {
    const months = Object.keys(monthlyData).sort().slice(-6);
    return months.map(month => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      count: monthlyData[month]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Admission Management</h2>
        <Button onClick={handleExport} variant="outline" className="border-school-blue text-school-blue" disabled={loading}>
          <Download className="h-4 w-4 mr-2" />
          {loading ? 'Exporting...' : 'Export Data'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Inquiries</p>
                <p className="text-3xl font-bold text-gray-800">{totalInquiries}</p>
              </div>
              <Users className="h-12 w-12 text-school-blue" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">This Month</p>
                <p className="text-3xl font-bold text-gray-800">{currentMonthCount}</p>
              </div>
              <Calendar className="h-12 w-12 text-school-orange" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg per Month</p>
                <p className="text-3xl font-bold text-gray-800">
                  {Object.keys(monthlyData).length > 0 
                    ? Math.round(totalInquiries / Object.keys(monthlyData).length)
                    : 0
                  }
                </p>
              </div>
              <TrendingUp className="h-12 w-12 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Inquiry Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getMonthlyStats().length > 0 ? (
              getMonthlyStats().map((stat, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{stat.month}</span>
                  <span className="text-2xl font-bold text-school-blue">{stat.count}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No inquiry data available</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Inquiry Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Admission Inquiries</CardTitle>
        </CardHeader>
        <CardContent>
          {(state.admissionInquiries?.length || 0) > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Class Applied</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Parents</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(state.admissionInquiries || []).map((inquiry, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{inquiry.studentName}</TableCell>
                    <TableCell>{inquiry.classApplied}</TableCell>
                    <TableCell>{inquiry.primaryContact}</TableCell>
                    <TableCell>
                      {inquiry.fatherName && <div>F: {inquiry.fatherName}</div>}
                      {inquiry.motherName && <div>M: {inquiry.motherName}</div>}
                    </TableCell>
                    <TableCell>{inquiry.location}</TableCell>
                    <TableCell>{new Date(inquiry.submittedAt || '').toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-gray-500 py-8">No admission inquiries yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Detailed Inquiries */}
      <Card>
        <CardHeader>
          <CardTitle>Inquiry Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(state.admissionInquiries || []).map((inquiry, index) => (
              <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-lg">{inquiry.studentName}</h3>
                    <p><strong>Class Applied:</strong> {inquiry.classApplied}</p>
                    <p><strong>Previous Class:</strong> {inquiry.previousClass || inquiry.presentClass}</p>
                    <p><strong>Previous School:</strong> {inquiry.previousSchool || "N/A"}</p>
                  </div>
                  <div>
                    <p><strong>Father's Name:</strong> {inquiry.fatherName}</p>
                    <p><strong>Mother's Name:</strong> {inquiry.motherName}</p>
                    <p><strong>Primary Contact:</strong> {inquiry.primaryContact}</p>
                    <p><strong>Secondary Contact:</strong> {inquiry.secondaryContact || "N/A"}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p><strong>Location:</strong> {inquiry.location}</p>
                    {inquiry.additionalInfo && (
                      <p className="mt-2"><strong>Additional Info:</strong> {inquiry.additionalInfo}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-2">
                      Submitted on: {new Date(inquiry.submittedAt || '').toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {!state.admissionInquiries?.length && (
              <p className="text-center text-gray-500 py-8">No admission inquiries yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdmissionManager;
