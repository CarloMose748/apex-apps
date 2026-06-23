import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { signUpCustomer } from '../lib/supabase';

// Address search uses Photon (https://photon.komoot.io) — free, OSM-backed, no API key.
// Geocoding result → our address shape (street, city, province, postcode, lat, lng).

interface BusinessDetails {
  // Personal Details
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  
  // Business Information
  businessName: string;
  businessType: string;
  businessRegistration: string;
  businessAddress: {
    formatted_address: string;
    street_number: string;
    route: string;
    locality: string;
    administrative_area_level_1: string;
    postal_code: string;
    country: string;
    place_id: string;
    latitude: number | null;
    longitude: number | null;
  };
  
  // Oil Collection Details
  hasOilBins: boolean;
  estimatedOilVolume: string;
  collectionFrequency: string;
  currentWasteProvider: string;
  
  // Location Details
  numberOfLocations: number;
  locations: Array<{
    name: string;
    address: string;
    city: string;
    state: string;
    postcode: string;
    numberOfBins: number;
    binSize: string;
  }>;
  
  // Additional Information
  hearAboutUs: string;
  specialRequirements: string;
  termsAccepted: boolean;
  marketingConsent: boolean;
}

// AddressFields — manual address entry + Photon-powered autocomplete (no API key)
function AddressFields({ onAddressChange, address }: {
  onAddressChange: (address: any) => void;
  address: any;
}) {
  const streetInputRef = useRef<HTMLInputElement>(null);
  const [suggestions, setSuggestions] = useState<PhotonHit[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [photonReady, setPhotonReady] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced Photon search; populates the suggestion dropdown.
  const searchPhoton = (q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q || q.length < 3) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        // Bias results to South Africa (ZA) via the `lang` param + the user typing
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5&lang=en`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        const hits: PhotonHit[] = (data.features || []).filter(
          (f: any) => f.properties?.country === 'South Africa' || f.properties?.countrycode === 'ZA'
        );
        setSuggestions(hits);
      } catch (e) {
        // Network error — silently fall back to manual entry.
      }
    }, 250);
  };

  // Mark Photon as "ready" on first keystroke (lazy — no script to load).
  useEffect(() => { setPhotonReady(true); }, []);

  const acceptSuggestion = (hit: PhotonHit) => {
    const next = photonHitToAddress(hit);
    onAddressChange(next);
    setSuggestions([]);
    setShowSuggestions(false);
    // Move focus to city field so user can correct if needed
    streetInputRef.current?.blur();
  };

  const update = (field: string, value: string) => {
    onAddressChange({ ...address, [field]: value });
  };

  return (
    <div className="address-fields">
      <div className="form-group" style={{ position: 'relative' }}>
        <label>Street address *</label>
        <input
          ref={streetInputRef}
          type="text"
          className="form-input"
          placeholder="Start typing your business address..."
          value={address?.route ? `${address.street_number ? address.street_number + ' ' : ''}${address.route}` : (address?.formatted_address || '')}
          onChange={(e) => {
            const v = e.target.value;
            onAddressChange({ ...address, formatted_address: v, route: v, street_number: '' });
            setShowSuggestions(true);
            searchPhoton(v);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          autoComplete="off"
          required
        />
        {photonReady && showSuggestions && suggestions.length > 0 && (
          <ul className="photon-suggestions" role="listbox">
            {suggestions.map((s, i) => (
              <li
                key={i}
                role="option"
                className="photon-suggestion"
                onMouseDown={(e) => { e.preventDefault(); acceptSuggestion(s); }}
              >
                <div className="ph-suggestion-main">{s.properties.name || s.properties.street || s.properties.city || 'Address'}</div>
                <div className="ph-suggestion-sub">{[s.properties.street, s.properties.city, s.properties.state, s.properties.country].filter(Boolean).join(', ')}</div>
              </li>
            ))}
          </ul>
        )}
        {photonReady && (
          <small className="form-help" style={{ color: '#16a34a' }}>
            ✓ Address suggestions are active (powered by OpenStreetMap)
          </small>
        )}
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>City / Town *</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Durban"
            value={address?.locality || ''}
            onChange={(e) => update('locality', e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Province *</label>
          <select
            className="form-input"
            value={address?.administrative_area_level_1 || ''}
            onChange={(e) => update('administrative_area_level_1', e.target.value)}
            required
          >
            <option value="">Select province</option>
            <option value="EC">Eastern Cape</option>
            <option value="FS">Free State</option>
            <option value="GP">Gauteng</option>
            <option value="KZN">KwaZulu-Natal</option>
            <option value="LP">Limpopo</option>
            <option value="MP">Mpumalanga</option>
            <option value="NC">Northern Cape</option>
            <option value="NW">North West</option>
            <option value="WC">Western Cape</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Postal code *</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. 4001"
            value={address?.postal_code || ''}
            onChange={(e) => update('postal_code', e.target.value)}
            maxLength={10}
            required
          />
        </div>
        <div className="form-group">
          <label>Country</label>
          <input
            type="text"
            className="form-input"
            value={address?.country || 'South Africa'}
            onChange={(e) => update('country', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

// Photon GeoJSON feature returned by /api/?q=...
interface PhotonHit {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] }; // [lng, lat]
  properties: {
    osm_id?: number;
    osm_type?: string;
    name?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    city?: string;
    state?: string;
    country?: string;
    countrycode?: string;
    type?: string;
  };
}

// Map a Photon hit → our address shape (same shape Google Places used to fill)
function photonHitToAddress(hit: PhotonHit) {
  const p = hit.properties || {};
  // Province code (Photon gives e.g. "KwaZulu-Natal" — map to "KZN" if possible)
  const stateMap: Record<string, string> = {
    'Eastern Cape': 'EC', 'Free State': 'FS', 'Gauteng': 'GP',
    'KwaZulu-Natal': 'KZN', 'Limpopo': 'LP', 'Mpumalanga': 'MP',
    'Northern Cape': 'NC', 'North West': 'NW', 'Western Cape': 'WC'
  };
  const provinceCode = stateMap[p.state || ''] || p.state || '';
  const formatted = [p.housenumber, p.street, p.city, p.state, p.country].filter(Boolean).join(', ');
  return {
    formatted_address: formatted,
    street_number: p.housenumber || '',
    route: p.street || '',
    locality: p.city || '',
    administrative_area_level_1: provinceCode,
    postal_code: p.postcode || '',
    country: p.country || 'South Africa',
    place_id: p.osm_id ? `osm:${p.osm_type || 'node'}:${p.osm_id}` : '',
    latitude: hit.geometry?.coordinates?.[1] ?? null,
    longitude: hit.geometry?.coordinates?.[0] ?? null
  };
}

export function Register() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<BusinessDetails>({
    // Personal Details
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    
    // Business Information
    businessName: '',
    businessType: '',
    businessRegistration: '',
    businessAddress: {
      formatted_address: '',
      street_number: '',
      route: '',
      locality: '',
      administrative_area_level_1: '',
      postal_code: '',
      country: 'South Africa',
      place_id: '',
      latitude: null,
      longitude: null
    },
    
    // Oil Collection Details
    hasOilBins: false,
    estimatedOilVolume: '',
    collectionFrequency: '',
    currentWasteProvider: '',
    
    // Location Details
    numberOfLocations: 1,
    locations: [{
      name: '',
      address: '',
      city: '',
      state: '',
      postcode: '',
      numberOfBins: 1,
      binSize: ''
    }],
    
    // Additional Information
    hearAboutUs: '',
    specialRequirements: '',
    termsAccepted: false,
    marketingConsent: false
  });

  const updateFormData = (field: keyof BusinessDetails, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 2));
      setError('');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError('');
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
          setError('Please fill in all personal details');
          return false;
        }
        if (!formData.password || formData.password.length < 8) {
          setError('Password must be at least 8 characters');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return false;
        }
        break;
      case 2:
        if (!formData.businessName || !formData.businessType) {
          setError('Please fill in your business name and type');
          return false;
        }
        const a = formData.businessAddress;
        if (!a.route || !a.locality || !a.administrative_area_level_1 || !a.postal_code) {
          setError('Please complete the full business address (street, city, province, postal code)');
          return false;
        }
        if (!formData.termsAccepted) {
          setError('You must accept the terms and conditions');
          return false;
        }
        break;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(2)) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // Compose a readable single-line address from the structured fields so
      // the customer record's `address` column is never empty when manual
      // entry is used (no Google autocomplete).
      const a = formData.businessAddress || {};
      const composedAddress = [
        [a.street_number, a.route].filter(Boolean).join(' '),
        a.locality,
        a.administrative_area_level_1,
        a.postal_code,
        a.country
      ].filter(Boolean).join(', ');

      // Prepare customer data for database
      const customerData = {
        email: formData.email,
        password: formData.password,
        full_name: `${formData.firstName} ${formData.lastName}`,
        phone_number: formData.phone,
        address: a.formatted_address || composedAddress,
        business_name: formData.businessName,
        business_type: formData.businessType,
        business_registration: formData.businessRegistration,
        latitude: a.latitude ?? null,
        longitude: a.longitude ?? null
      };

      console.log('Submitting customer data:', customerData);

      // Sign up the customer (creates auth user + customer record)
      const { data, error: signUpError } = await signUpCustomer(customerData);
      
      console.log('SignUp response:', { data, error: signUpError });
      
      if (signUpError) {
        console.error('SignUp error:', signUpError);
        setError(signUpError);
        setIsLoading(false);
        return;
      }

      if (data?.user) {
        // Store registration data in localStorage for demo mode
        localStorage.setItem('demo-registration', JSON.stringify(formData));
        
        alert('Registration successful! Your account is pending admin approval. You will be able to log in once your account is activated.');
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Registration failed. Please try again.');
    }
    
    setIsLoading(false);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="register-step">
            <h3>Personal Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => updateFormData('firstName', e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => updateFormData('lastName', e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                className="form-input"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => updateFormData('phone', e.target.value)}
                className="form-input"
                required
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateFormData('password', e.target.value)}
                  className="form-input"
                  minLength={8}
                  required
                />
              </div>
              <div className="form-group">
                <label>Confirm Password *</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="register-step">
            <h3>Business Information</h3>
            <div className="form-group">
              <label>Business Name *</label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => updateFormData('businessName', e.target.value)}
                className="form-input"
                required
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Business Type *</label>
                <select
                  value={formData.businessType}
                  onChange={(e) => updateFormData('businessType', e.target.value)}
                  className="form-input"
                  required
                >
                  <option value="">Select business type</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="cafe">Cafe</option>
                  <option value="fast-food">Fast Food</option>
                  <option value="hotel">Hotel</option>
                  <option value="catering">Catering</option>
                  <option value="food-processing">Food Processing</option>
                  <option value="other">Other Food Service</option>
                </select>
              </div>
              <div className="form-group">
                <label>Business Registration Number</label>
                <input
                  type="text"
                  value={formData.businessRegistration}
                  onChange={(e) => updateFormData('businessRegistration', e.target.value)}
                  className="form-input"
                  placeholder=""
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Business Address *</label>
              <AddressFields
                address={formData.businessAddress}
                onAddressChange={(address) => updateFormData('businessAddress', address)}
              />
              <small className="form-help" style={{ color: '#6b7280' }}>
                Type your address — Google suggestions may appear if available, otherwise fill the fields manually.
              </small>
            </div>
            
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.termsAccepted}
                  onChange={(e) => updateFormData('termsAccepted', e.target.checked)}
                  required
                />
                <span className="checkbox-text">
                  I accept the <a href="/terms" target="_blank">Terms and Conditions</a> and <a href="/privacy" target="_blank">Privacy Policy</a> *
                </span>
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <div className="register-logo">
            <img src="/logo-apex.png" alt="Apex Chem" className="register-logo__image" />
            <p>Business Registration</p>
          </div>
          
          <div className="progress-bar">
            <div className="progress-steps">
              {[1, 2].map(step => (
                <div
                  key={step}
                  className={`progress-step ${step <= currentStep ? 'active' : ''} ${step < currentStep ? 'completed' : ''}`}
                >
                  <span>{step}</span>
                </div>
              ))}
            </div>
            <div className="progress-labels">
              <span>Personal</span>
              <span>Business & Terms</span>
            </div>
          </div>
        </div>

        <div className="register-content">
          <form onSubmit={handleSubmit}>
            {renderStep()}
            
            {error && (
              <div className="form-error">{error}</div>
            )}
            
            <div className="register-actions">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="btn-secondary"
                  disabled={isLoading}
                >
                  Previous
                </button>
              )}
              
              {currentStep < 2 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="btn-primary"
                  disabled={isLoading}
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Registering...' : 'Complete'}
                </button>
              )}
            </div>
          </form>
          
          <div className="auth-footer">
            <p>Already have an account? <Link to="/login" className="auth-link">Sign In</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}