import { useSchool } from '@/contexts/SchoolContext';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

const PublicNoticeBoard = () => {
  const { state } = useSchool();
  const { notices } = state.data;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-3xl font-bold text-center text-school-blue">
        Notice Board
      </h1>

      {notices.length === 0 ? (
        <p className="text-center text-gray-500">
          No notices available at the moment.
        </p>
      ) : (
        <div className="space-y-4">
          {notices.map((notice) => (
            <Card key={notice.id}>
              <CardContent className="p-5 space-y-2">
                
                {/* Type + Date */}
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className={`px-2 py-1 rounded text-white text-xs
                    ${notice.type === 'Event' ? 'bg-school-orange' :
                      notice.type === 'Academic' ? 'bg-school-blue' :
                      notice.type === 'Meeting' ? 'bg-green-500' :
                      'bg-gray-500'}
                  `}>
                    {notice.type}
                  </span>

                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {notice.date}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-lg font-semibold">
                  {notice.title}
                </h2>

                {/* Content */}
                <p className="text-gray-700">
                  {notice.content}
                </p>

              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PublicNoticeBoard;
