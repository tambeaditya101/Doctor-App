export default function Greeting({ userName }) {
  if (!userName) return null;

  return (
    <div className='text-xl font-extrabold'>
      Welcome,{' '}
      <span
        className='
          bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 
          bg-clip-text text-transparent 
          transition-all duration-500 ease-in-out
          hover:from-pink-500 hover:via-purple-500 hover:to-blue-500
        '
      >
        {userName}
      </span>{' '}
      👋
    </div>
  );
}
