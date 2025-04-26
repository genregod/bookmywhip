import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SearchIcon, MapPinIcon, XIcon } from 'lucide-react';
import { searchLocation } from '@/lib/azureMaps';
import { GEOCODING_DEBOUNCE_MS, GEOCODING_MIN_CHARS } from '@/lib/constants';

interface SearchResult {
  id: string;
  name: string;
  position: [number, number]; // [longitude, latitude]
}

interface LocationSearchProps {
  onLocationSelect: (location: { name: string; lat: number; lng: number }) => void;
  placeholder?: string;
  defaultValue?: string;
  className?: string;
}

export function LocationSearch({
  onLocationSelect,
  placeholder = 'Search for a location',
  defaultValue = '',
  className = ''
}: LocationSearchProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const [inputValue, setInputValue] = useState(defaultValue);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  // Debounced search function
  const debouncedSearch = useCallback(
    async (query: string) => {
      if (query.length < GEOCODING_MIN_CHARS) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const results = await searchLocation(query);
        setResults(
          results.map(result => ({
            id: result.properties.id,
            name: result.properties.name,
            position: result.geometry.coordinates as [number, number]
          }))
        );
      } catch (error) {
        console.error('Error searching for location:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Debounce input changes
  useEffect(() => {
    const handler = setTimeout(() => {
      debouncedSearch(inputValue);
    }, GEOCODING_DEBOUNCE_MS);

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue, debouncedSearch]);

  const handleSelect = (result: SearchResult) => {
    setValue(result.name);
    setOpen(false);
    onLocationSelect({
      name: result.name,
      // Convert from [longitude, latitude] to { lat, lng }
      lat: result.position[1],
      lng: result.position[0]
    });
  };

  const clearInput = () => {
    setValue('');
    setInputValue('');
    setResults([]);
  };

  return (
    <div className={`relative ${className}`}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              placeholder={placeholder}
              value={value}
              onChange={(e) => {
                const newValue = e.target.value;
                setValue(newValue);
                setInputValue(newValue);
                if (newValue.length >= GEOCODING_MIN_CHARS) {
                  setOpen(true);
                } else {
                  setOpen(false);
                }
              }}
              className="pr-10"
            />
            <div className="absolute inset-y-0 right-0 flex items-center">
              {value ? (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 mr-1" 
                  onClick={clearInput}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              ) : (
                <SearchIcon className="h-4 w-4 mr-3 text-muted-foreground" />
              )}
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-full" align="start">
          <Command>
            <CommandInput 
              placeholder={placeholder} 
              value={inputValue}
              onValueChange={(value) => {
                setInputValue(value);
              }}
            />
            {loading && (
              <div className="py-6 text-center">
                <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent text-primary rounded-full" role="status">
                  <span className="sr-only">Loading...</span>
                </div>
              </div>
            )}
            {!loading && (
              <CommandEmpty className="py-6 text-center text-sm">
                No locations found. Try a different search term.
              </CommandEmpty>
            )}
            <CommandGroup>
              {results.map((result) => (
                <CommandItem
                  key={result.id}
                  onSelect={() => handleSelect(result)}
                  className="flex items-center"
                >
                  <MapPinIcon className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{result.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}