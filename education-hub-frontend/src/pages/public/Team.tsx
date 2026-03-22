import { useState, useEffect } from "react";
import { Mail, Phone, Linkedin, Users, Award, Star } from "lucide-react";
import api from "../../lib/api";
import SEO from "../../components/SEO";

interface TeamMember {
  id: number;
  name: string;
  position: string;
  role_type: string;
  photo: string;
  bio: string;
  email: string;
  phone: string;
  linkedin: string;
}

export default function Team() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/team").then((r) => {
      setMembers(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const directors = members.filter((m) => m.role_type === "director");
  const staff = members.filter((m) => m.role_type === "staff");

  return (
    <div>
      <SEO
        title="Our Team - Expert Education Counselors"
        description="Meet the expert team at Education Hub. Our experienced directors and counselors are dedicated to guiding students toward their dream education."
        keywords="education hub team, education counselors, admission experts, Jaipur education consultants, student counselors"
        canonical="/team"
      />
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 text-white py-20">
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <span className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-sm text-blue-200 text-sm font-semibold rounded-full mb-4">
            <Users className="inline h-4 w-4 mr-1" /> OUR TEAM
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
            Meet Our <span className="text-yellow-400">Expert Team</span>
          </h1>
          <p className="text-lg text-blue-200 max-w-2xl mx-auto">
            Dedicated professionals committed to guiding students toward their dream education
          </p>
        </div>
      </section>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {/* Directors Section */}
          {directors.length > 0 && (
            <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
              <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-16">
                  <span className="inline-block px-5 py-2 bg-yellow-100 text-yellow-700 text-sm font-bold rounded-full mb-4">
                    <Award className="inline h-4 w-4 mr-1" /> LEADERSHIP
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                    Our <span className="text-indigo-600">Directors</span>
                  </h2>
                  <p className="mt-3 text-gray-500 max-w-xl mx-auto">
                    Visionary leaders driving Education Hub&apos;s mission forward
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto">
                  {directors.map((d) => (
                    <div key={d.id} className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-2">
                      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-center relative">
                        <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                          <Star className="h-3 w-3" /> Director
                        </div>
                        <img
                          src={d.photo || "https://www.vgu.ac.in/assets/img/events/eventsandactivities/Mr.%20Awadh%20Ojha.jpg"}
                          alt={d.name}
                          className="h-32 w-32 rounded-full object-cover mx-auto border-4 border-white/30 shadow-xl"
                        />
                        <h3 className="text-xl font-bold text-white mt-4">{d.name}</h3>
                        <p className="text-indigo-200 text-sm font-medium mt-1">{d.position}</p>
                      </div>
                      <div className="p-6">
                        <p className="text-gray-600 text-sm leading-relaxed mb-5">{d.bio}</p>
                        <div className="flex items-center justify-center gap-3">
                          {d.email && (
                            <a href={`mailto:${d.email}`} className="btn-3d btn-3d-blue h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700">
                              <Mail className="h-4 w-4" />
                            </a>
                          )}
                          {d.phone && (
                            <a href={`tel:${d.phone}`} className="btn-3d btn-3d-green h-10 w-10 bg-emerald-600 rounded-full flex items-center justify-center text-white hover:bg-emerald-700">
                              <Phone className="h-4 w-4" />
                            </a>
                          )}
                          {d.linkedin && (
                            <a href={d.linkedin} target="_blank" rel="noopener noreferrer" className="h-10 w-10 bg-blue-700 rounded-full flex items-center justify-center text-white hover:bg-blue-800">
                              <Linkedin className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Staff Section */}
          {staff.length > 0 && (
            <section className="py-20 bg-white">
              <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-16">
                  <span className="inline-block px-5 py-2 bg-blue-100 text-blue-700 text-sm font-bold rounded-full mb-4">
                    <Users className="inline h-4 w-4 mr-1" /> OUR TEAM
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                    Our <span className="text-blue-600">Expert Staff</span>
                  </h2>
                  <p className="mt-3 text-gray-500 max-w-xl mx-auto">
                    Experienced professionals providing exceptional service to every student
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {staff.map((s) => (
                    <div key={s.id} className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-2">
                      <div className="relative">
                        <img
                          src={s.photo || "https://www.vgu.ac.in/assets/img/events/eventsandactivities/Realme%20event%20Rahul%20dua.jpg"}
                          alt={s.name}
                          className="w-full h-56 object-cover object-top"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4">
                          <h3 className="text-lg font-bold text-white">{s.name}</h3>
                          <p className="text-blue-300 text-sm font-medium">{s.position}</p>
                        </div>
                      </div>
                      <div className="p-5">
                        <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2">{s.bio}</p>
                        <div className="flex flex-wrap items-center gap-2">
                          {s.email && (
                            <a href={`mailto:${s.email}`} className="btn-3d btn-3d-blue text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg flex items-center gap-1 font-bold">
                              <Mail className="h-3 w-3" /> Email
                            </a>
                          )}
                          {s.phone && (
                            <a href={`tel:${s.phone}`} className="btn-3d btn-3d-green text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg flex items-center gap-1 font-bold">
                              <Phone className="h-3 w-3" /> Call
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
