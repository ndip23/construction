import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DashboardShell } from '../components/layout/DashboardShell';
import {
  Users, Banknote, Clock, CalendarClock, ListChecks, ArrowRight
} from 'lucide-react';


const DashboardCard = ({ icon: Icon, title, desc, path, delay, isPrimary, className }: any) => (
  <Link to={path} className={`group block relative overflow-hidden rounded-[2rem] border transition-all duration-300 hover:-translate-y-1 ${
    isPrimary
      ? 'bg-foreground text-background border-foreground shadow-xl'
      : 'bg-card text-foreground border-border shadow-sm hover:shadow-lg'
  } ${className || ''}`}>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="relative z-10 h-full p-5 sm:p-8 flex flex-col justify-between"
    >
      <div className="flex justify-between items-start mb-4 sm:mb-6">
        <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-[1rem] flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
          isPrimary ? 'bg-background/10 text-primary' : 'bg-muted text-foreground'
        }`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 transform translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 ${
          isPrimary ? 'bg-primary text-foreground' : 'bg-foreground text-background'
        }`}>
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>
      <div>
        <h3 className="text-lg sm:text-xl font-black mb-1 sm:mb-2 tracking-tight">{title}</h3>
        <p className={`text-[11px] sm:text-[13px] font-medium leading-relaxed ${
          isPrimary ? 'text-background/80' : 'text-muted-foreground'
        }`}>{desc}</p>
      </div>
    </motion.div>
    {isPrimary && (
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/30 to-transparent rounded-full blur-3xl -mr-10 -mt-10" />
    )}
  </Link>
);

const WorkersManagement = () => {
  return (
    <DashboardShell>
      <div className="max-w-[1600px] mx-auto pb-20">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 border-b border-border pb-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-4xl font-black text-foreground tracking-tight leading-tight">
              Workers Management
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-2">
              Oversee your team, payroll, time, and tasks in one place.
            </p>
          </motion.div>
        </div>

        {/* GRID LAYOUT */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          <DashboardCard
            icon={Users}
            title="Workers & Team"
            desc="Manage your workforce, profiles, and site engineers."
            path="/dashboard/workforce"
            delay={0.05}
            isPrimary={true}
          />
          <DashboardCard
            icon={Banknote}
            title="Payroll"
            desc="Manage worker payments, stipends, and salary runs."
            path="/dashboard/payroll"
            delay={0.1}
          />
          <DashboardCard
            icon={Clock}
            title="Attendance"
            desc="Track daily sign-ins, absenteeism, and site presence."
            path="/dashboard/attendance"
            delay={0.15}
          />
          <DashboardCard
            icon={CalendarClock}
            title="Timesheets"
            desc="Review hours logged and approve timesheets."
            path="/dashboard/timesheets"
            delay={0.2}
          />
          <DashboardCard
            icon={ListChecks}
            title="Tasks"
            desc="Assign operational tasks and monitor completion."
            path="/dashboard/tasks"
            delay={0.25}
          />
        </div>
      </div>
    </DashboardShell>
  );
};

export default WorkersManagement;
