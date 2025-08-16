import Button from '../Button';
import Card from '../Card';
import Select from '../Select';
import SpecializationSelect from '../SpecializationSelect';

export default function Filters({ filters, setFilters, onSearch }) {
  return (
    <Card className='space-y-3'>
      <h2 className='text-lg font-semibold'>Discover Doctors</h2>
      <div className='grid gap-3 sm:grid-cols-3'>
        <SpecializationSelect
          value={filters.specialization}
          onChange={(val) => setFilters((f) => ({ ...f, specialization: val }))}
        />

        <Select
          label='Mode'
          value={filters.mode}
          onChange={(e) => setFilters((f) => ({ ...f, mode: e.target.value }))}
        >
          <option value=''>Any</option>
          <option value='online'>Online</option>
          <option value='in-person'>In-person</option>
        </Select>

        <div className='flex items-end'>
          <Button className='w-full' onClick={onSearch}>
            Search
          </Button>
        </div>
      </div>
    </Card>
  );
}
