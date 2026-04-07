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

// Google Places Autocomplete Component
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
      defaultValue={value}
      required
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
        if (!formData.businessName || !formData.businessType || !formData.businessAddress.formatted_address) {
          setError('Please fill in all business details');
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
      // Prepare customer data for database
      const customerData = {
        email: formData.email,
        password: formData.password,
        full_name: `${formData.firstName} ${formData.lastName}`,
        phone_number: formData.phone,
        address: formData.businessAddress?.formatted_address || '',
        business_name: formData.businessName,
        business_type: formData.businessType,
        business_registration: formData.businessRegistration,
        latitude: formData.businessAddress?.latitude || null,
        longitude: formData.businessAddress?.longitude || null
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
              <AddressAutocomplete
                value={formData.businessAddress.formatted_address}
                onAddressSelect={(address) => updateFormData('businessAddress', address)}
              />
              {formData.businessAddress.formatted_address && (
                <div className="address-preview">
                  <small className="form-help">
                    Selected: {formData.businessAddress.locality}, {formData.businessAddress.administrative_area_level_1} {formData.businessAddress.postal_code}
                  </small>
                </div>
              )}
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
            <h1>Apex</h1>
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