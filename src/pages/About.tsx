
import { useSchool } from '@/contexts/SchoolContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const About = () => {
  const { state } = useSchool();
  const { 
    schoolHistory, 
    founderDetails, 
    founders 
  } = state.data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-school-blue-light via-white to-school-orange-light">
      <div className="container mx-auto px-4 py-8 space-y-12">
        {/* Page Header */}
        <section className="text-center animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-school-blue mb-4">
            About Our School
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Learn about our rich history, vision, and commitment to educational excellence
          </p>
        </section>

        {/* School History */}
        <section className="animate-fade-in">
          <Card className="hover:shadow-lg transition-shadow duration-300 bg-white/80 backdrop-blur-sm border border-school-blue/20">
            <CardHeader>
              <CardTitle className="text-3xl text-school-blue">Our History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg text-gray-700 leading-relaxed">
                {schoolHistory}
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Founders */}
        <section className="animate-fade-in">
          <Card className="hover:shadow-lg transition-shadow duration-300 bg-white/80 backdrop-blur-sm border border-school-blue/20">
            <CardHeader>
              <CardTitle className="text-3xl text-school-blue">Our Founders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                {founderDetails}
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {founders.map((founder) => (
                  <div key={founder.id} className="text-center">
                    <img
                      src={founder.image}
                      alt={founder.name}
                      className="w-32 h-32 object-cover rounded-full mx-auto mb-4 shadow-md"
                    />
                    <h4 className="text-xl font-semibold text-school-blue mb-2">{founder.name}</h4>
                    <p className="text-gray-600 text-sm">{founder.details}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Mission & Vision */}
        <section className="animate-fade-in">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="hover:shadow-lg transition-shadow duration-300 bg-white/80 backdrop-blur-sm border border-school-blue/20">
              <CardHeader>
                <CardTitle className="text-2xl text-school-blue">Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  To provide exceptional education that empowers students to become 
                  confident, creative, and compassionate individuals who contribute 
                  positively to society while maintaining the highest academic standards.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-300 bg-white/80 backdrop-blur-sm border border-school-blue/20">
              <CardHeader>
                <CardTitle className="text-2xl text-school-blue">Our Vision</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  To be a leading educational institution that nurtures future leaders, 
                  innovators, and global citizens through excellence in teaching, 
                  character development, and holistic growth.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
