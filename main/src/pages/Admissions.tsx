
import AdmissionFeatures from '@/components/admissions/AdmissionFeatures';
import AdmissionForm from '@/components/admissions/AdmissionForm';

const Admissions = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8 space-y-12">
        {/* Page Header */}
        <section className="text-center animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-school-blue mb-4">
            Admissions
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join our community of learners and embark on a journey of academic excellence
          </p>
        </section>

        {/* Features Section */}
        <AdmissionFeatures />

        {/* Admission Form */}
        <AdmissionForm />
      </div>
    </div>
  );
};

export default Admissions;
