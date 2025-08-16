import DoctorCard from './DoctorCard';

export default function DoctorsList({ doctors, onBook }) {
  return (
    <div className='space-y-3'>
      {doctors.map((doc, idx) => (
        <DoctorCard key={idx} doctor={doc} onBook={onBook} />
      ))}
    </div>
  );
}
