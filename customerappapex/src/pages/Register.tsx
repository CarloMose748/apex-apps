import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { signUpCustomer } from '../lib/supabase';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBvYq6yNASqpfBkXWuUUliHe5dJmg5mlJs';

// Google Maps types
declare global {
  interface Window {
    google: any;
  }
}

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

// AddressFields — manual address entry + optional Google autocomplete
function AddressFields({ onAddressChange, address }: {
  onAddressChange: (address: any) => void;
  address: any;
}) {
  const streetInputRef = useRef<HTMLInputElement>(null);
  const [googleReady, setGoogleReady] = useState(false);

  // Try to load Google Places in the background; do NOT block manual entry.
  useEffect(() => {
    const init = () => {
      if (!streetInputRef.current || !window.google?.maps?.places) return;
      try {
        const ac = new window.google.maps.places.Autocomplete(streetInputRef.current, {
          types: ['address'],
          componentRestrictions: { country: 'za' },
          fields: ['address_components', 'formatted_address', 'place_id', 'geometry']
        });
        ac.addListener('place_changed', () => {
          const place = ac.getPlace();
          if (!place.address_components) return;
          const next = parsePlace(place);
          onAddressChange(next);
        });
        setGoogleReady(true);
      } catch (e) {
        console.warn('Google Autocomplete failed to initialise:', e);
      }
    };

    if (window.google && window.google.maps) { init(); return; }
    if (document.querySelector('script[data-google-maps]')) return; // already loading

    const s = document.createElement('script');
    s.setAttribute('data-google-maps', '1');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    s.onload = init;
    s.onerror = () => console.warn('Google Maps script failed to load — manual entry is still available');
    document.head.appendChild(s);
  }, [onAddressChange]);

  const update = (field: string, value: string) => {
    onAddressChange({ ...address, [field]: value });
  };

  return (
    <div className="address-fields">
      <div className="form-group">
        <label>Street address *</label>
        <input
          ref={streetInputRef}
          type="text"
          className="form-input"
          placeholder={googleReady ? 'Start typing — Google will suggest addresses' : 'e.g. 12 Marine Drive'}
          value={address?.route ? `${address.street_number ? address.street_number + ' ' : ''}${address.route}` : ''}
          onChange={(e) => {
            // Mirror raw text into route for now; user can refine city/postcode below
            onAddressChange({ ...address, formatted_address: e.target.value, route: e.target.value, street_number: '' });
          }}
          autoComplete="off"
          required
        />
        {googleReady && (
          <small className="form-help" style={{ color: '#16a34a' }}>
            ✓ Google address suggestions are active
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

// Helper: turn a Google Place into our address shape
function parsePlace(place: any) {
  const out: any = {
    formatted_address: place.formatted_address || '',
    street_number: '',
    route: '',
    locality: '',
    administrative_area_level_1: '',
    postal_code: '',
    country: 'South Africa',
    place_id: place.place_id || '',
    latitude: place.geometry?.location?.lat() ?? null,
    longitude: place.geometry?.location?.lng() ?? null
  };
  (place.address_components || []).forEach((c: any) => {
    if (c.types.includes('street_number')) out.street_number = c.long_name;
    if (c.types.includes('route'))         out.route = c.long_name;
    if (c.types.includes('locality'))      out.locality = c.long_name;
    if (c.types.includes('administrative_area_level_1')) out.administrative_area_level_1 = c.short_name;
    if (c.types.includes('postal_code'))   out.postal_code = c.long_name;
    if (c.types.includes('country'))       out.country = c.long_name;
  });
  return out;
}

// Legacy single-input Google autocomplete — kept for any other callers, but
// the registration form now uses AddressFields above.
function AddressAutocomplete({ onAddressSelect, value }: {
  onAddressSelect: (address: any) => void;
  value: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        initializeAutocomplete();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.onload = initializeAutocomplete;
      script.onerror = () => {
        console.warn('Google Maps failed to load — falling back to manual address entry');
      };
      document.head.appendChild(script);
    };

    const initializeAutocomplete = () => {
      if (!inputRef.current) return;

      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'ZA' },
        fields: ['address_components', 'formatted_address', 'place_id', 'geometry']
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.address_components) return;

        const addressComponents = place.address_components;
        const address = {
          formatted_address: place.formatted_address || '',
          street_number: '',
          route: '',
          locality: '',
          administrative_area_level_1: '',
          postal_code: '',
          country: 'South Africa',
          place_id: place.place_id || '',
          latitude: place.geometry?.location?.lat() || null,
          longitude: place.geometry?.location?.lng() || null
        };

        addressComponents.forEach((component: any) => {
          const types = component.types;
          if (types.includes('street_number')) {
            address.street_number = component.long_name;
          }
          if (types.includes('route')) {
            address.route = component.long_name;
          }
          if (types.includes('locality')) {
            address.locality = component.long_name;
          }
          if (types.includes('administrative_area_level_1')) {
            address.administrative_area_level_1 = component.short_name;
          }
          if (types.includes('postal_code')) {
            address.postal_code = component.long_name;
          }
          if (types.includes('country')) {
            address.country = component.long_name;
          }
        });

        onAddressSelect(address);
      });
    };

    loadGoogleMaps();
  }, [onAddressSelect]);

  return (
    <input
      ref={inputRef}
      type="text"
      className="form-input"
      placeholder="Start typing your South African business address..."
      value={value}
      onChange={(e) => onAddressSelect({
        formatted_address: e.target.value,
        street_number: '',
        route: '',
        locality: '',
        administrative_area_level_1: '',
        postal_code: '',
        country: 'South Africa',
        place_id: '',
        latitude: null,
        longitude: null
      })}
      autoComplete="off"
    />
  );
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