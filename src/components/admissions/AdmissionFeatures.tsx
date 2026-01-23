
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, Users, Building, Trophy } from 'lucide-react';

const AdmissionFeatures = () => {
  const features = [
    {
      icon: GraduationCap,
      title: "Quality Education",
      description: "Comprehensive curriculum designed for holistic development"
    },
    {
      icon: Users,
      title: "Experienced Faculty",
      description: "Dedicated teachers committed to student success"
    },
    {
      icon: Building,
      title: "Modern Facilities",
      description: "Well-equipped classrooms and laboratories"
    },
    {
      icon: Trophy,
      title: "Excellence Record",
      description: "Proven track record of academic achievements"
    }
  ];

  return (
    <section className="animate-fade-in">
      <div className="grid md:grid-cols-4 gap-6 mb-12">
        {features.map((feature, index) => (
          <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent className="space-y-4">
              <feature.icon className="h-12 w-12 text-school-blue mx-auto" />
              <h3 className="font-semibold text-lg text-school-blue">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default AdmissionFeatures;
