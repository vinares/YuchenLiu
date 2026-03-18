import { skeleton } from '../../utils';

interface SkillCategory {
  category: string;
  items: string[];
}

const SkillCard = ({
  loading,
  skills,
}: {
  loading: boolean;
  skills: SkillCategory[];
}) => {
  const renderSkeleton = () => {
    const array = [];
    for (let index = 0; index < 12; index++) {
      array.push(
        <div key={index}>
          {skeleton({ widthCls: 'w-24', heightCls: 'h-6', className: 'm-1' })}
        </div>,
      );
    }

    return array;
  };

  return (
    <div className="card shadow-lg compact bg-base-100">
      <div className="card-body">
        <div className="mx-3">
          <h5 className="card-title">
            {loading ? (
              skeleton({ widthCls: 'w-32', heightCls: 'h-8' })
            ) : (
              <span className="text-base-content opacity-70">Tech Stack</span>
            )}
          </h5>
        </div>
        <div className="p-3 flow-root">
          {loading ? (
            <div className="-m-1 flex flex-wrap justify-center">
              {renderSkeleton()}
            </div>
          ) : (
            <div className="space-y-4">
              {skills.map((group, groupIndex) => (
                <div key={groupIndex}>
                  <h6 className="text-sm font-semibold text-base-content opacity-60 mb-2 ml-1">
                    {group.category}
                  </h6>
                  <div className="-m-1 flex flex-wrap">
                    {group.items.map((skill, index) => (
                      <div
                        key={index}
                        className="m-1 text-xs inline-flex items-center font-bold leading-sm px-3 py-1 badge-primary bg-opacity-90 rounded-full"
                      >
                        {skill}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillCard;
