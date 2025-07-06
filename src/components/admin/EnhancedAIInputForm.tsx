// src/components/admin/EnhancedAIInputForm.tsx
// Enhanced AI Input Form with proper TypeScript types

import React, { useState } from 'react';
import { 
  Brain, 
  Eye, 
  Palette, 
  Scissors, 
  Sparkles, 
  Tag, 
  Users, 
  Heart, 
  Star,
  ChevronDown,
  ChevronUp,
  Camera,
  Wand2,
  Settings,
  RefreshCw
} from 'lucide-react';

// ✅ FIXED: TypeScript interfaces
interface FormData {
  // Material Details
  primaryMaterial: string
  secondaryMaterials: string
  fabricWeight: string
  fabricTexture: string
  
  // Design & Style
  designStyle: string
  patterns: string
  embellishments: string
  colorScheme: string
  dominantColors: string
  
  // Cultural Context
  culturalOrigin: string
  traditionalName: string
  occasions: string[]
  significance: string
  
  // Target Audience
  targetAge: string
  targetGender: string
  targetOccasion: string
  priceRange: string
  
  // Unique Features
  uniqueFeatures: string
  craftmanship: string
  careInstructions: string
  
  // AI Preferences
  tone: string
  length: string
  keywords: string
  includeHistory: boolean
  includeCare: boolean
}

interface EnhancedAIInputFormProps {
  onDataChange?: (data: FormData) => void
  initialData?: Partial<FormData>
}

const EnhancedAIInputForm: React.FC<EnhancedAIInputFormProps> = ({ 
  onDataChange, 
  initialData = {} 
}) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    // Material Details
    primaryMaterial: initialData.primaryMaterial || '',
    secondaryMaterials: initialData.secondaryMaterials || '',
    fabricWeight: initialData.fabricWeight || '',
    fabricTexture: initialData.fabricTexture || '',
    
    // Design & Style
    designStyle: initialData.designStyle || '',
    patterns: initialData.patterns || '',
    embellishments: initialData.embellishments || '',
    colorScheme: initialData.colorScheme || '',
    dominantColors: initialData.dominantColors || '',
    
    // Cultural Context
    culturalOrigin: initialData.culturalOrigin || '',
    traditionalName: initialData.traditionalName || '',
    occasions: initialData.occasions || [],
    significance: initialData.significance || '',
    
    // Target Audience
    targetAge: initialData.targetAge || '',
    targetGender: initialData.targetGender || '',
    targetOccasion: initialData.targetOccasion || '',
    priceRange: initialData.priceRange || '',
    
    // Unique Features
    uniqueFeatures: initialData.uniqueFeatures || '',
    craftmanship: initialData.craftmanship || '',
    careInstructions: initialData.careInstructions || '',
    
    // AI Preferences
    tone: initialData.tone || 'elegant',
    length: initialData.length || 'medium',
    keywords: initialData.keywords || '',
    includeHistory: initialData.includeHistory ?? true,
    includeCare: initialData.includeCare ?? true
  });

  // ✅ FIXED: Properly typed function parameters
  const handleInputChange = (field: keyof FormData, value: string | boolean | string[]): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Notify parent component of changes
    if (onDataChange) {
      const updatedData = { ...formData, [field]: value };
      onDataChange(updatedData);
    }
  };

  // ✅ FIXED: Properly typed array change handler
  const handleArrayChange = (field: keyof FormData, value: string): void => {
    const currentArray = formData[field] as string[];
    const newArray = currentArray.includes(value) 
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    handleInputChange(field, newArray);
  };

  // ✅ FIXED: Properly typed generate function
  const handleGenerateAI = async (): Promise<void> => {
    setAnalyzing(true);
    try {
      // Simulate AI generation - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Add your AI generation logic here
    } catch (error) {
      console.error('AI generation failed:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  // Predefined options
  const tones = [
    { value: 'elegant', label: 'Elegant & Sophisticated' },
    { value: 'casual', label: 'Casual & Friendly' },
    { value: 'luxury', label: 'Luxury & Premium' },
    { value: 'traditional', label: 'Traditional & Cultural' },
    { value: 'modern', label: 'Modern & Contemporary' }
  ];

  const occasions = [
    'Wedding', 'Festival', 'Party', 'Casual', 'Office', 'Religious', 
    'Traditional', 'Modern', 'Special Events', 'Daily Wear'
  ];

  const designStyles = [
    'Traditional', 'Contemporary', 'Fusion', 'Vintage', 'Modern', 
    'Ethnic', 'Bohemian', 'Minimalist', 'Ornate', 'Classic'
  ];

  const materials = [
    'Cotton', 'Silk', 'Chiffon', 'Georgette', 'Velvet', 'Linen', 
    'Wool', 'Crepe', 'Satin', 'Brocade', 'Net', 'Organza'
  ];

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Enhanced AI Content Generator</h3>
            <p className="text-sm text-gray-600">Provide detailed information for AI-powered descriptions</p>
          </div>
        </div>
        
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {/* Basic Information - Always Visible */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Scissors className="inline h-4 w-4 mr-1" />
            Primary Material
          </label>
          <select
            value={formData.primaryMaterial}
            onChange={(e) => handleInputChange('primaryMaterial', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">Select material...</option>
            {materials.map(material => (
              <option key={material} value={material}>{material}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Palette className="inline h-4 w-4 mr-1" />
            Dominant Colors
          </label>
          <input
            type="text"
            value={formData.dominantColors}
            onChange={(e) => handleInputChange('dominantColors', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="e.g., Deep red, golden yellow"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Eye className="inline h-4 w-4 mr-1" />
            Design Style
          </label>
          <select
            value={formData.designStyle}
            onChange={(e) => handleInputChange('designStyle', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">Select style...</option>
            {designStyles.map(style => (
              <option key={style} value={style}>{style}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Users className="inline h-4 w-4 mr-1" />
            Target Occasions
          </label>
          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
            {occasions.map(occasion => (
              <button
                key={occasion}
                type="button"
                onClick={() => handleArrayChange('occasions', occasion)}
                className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                  formData.occasions.includes(occasion)
                    ? 'bg-purple-100 border-purple-300 text-purple-700'
                    : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {occasion}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="space-y-6 border-t pt-6">
          {/* Material Details */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Scissors className="h-4 w-4" />
              Material & Fabric Details
            </h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Materials</label>
                <input
                  type="text"
                  value={formData.secondaryMaterials}
                  onChange={(e) => handleInputChange('secondaryMaterials', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Cotton lining, silk borders"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fabric Weight</label>
                <select
                  value={formData.fabricWeight}
                  onChange={(e) => handleInputChange('fabricWeight', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select weight...</option>
                  <option value="light">Light</option>
                  <option value="medium">Medium</option>
                  <option value="heavy">Heavy</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fabric Texture</label>
                <input
                  type="text"
                  value={formData.fabricTexture}
                  onChange={(e) => handleInputChange('fabricTexture', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Smooth, textured, embossed"
                />
              </div>
            </div>
          </div>

          {/* Cultural Context */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Cultural Context
            </h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cultural Origin</label>
                <input
                  type="text"
                  value={formData.culturalOrigin}
                  onChange={(e) => handleInputChange('culturalOrigin', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Rajasthani, Bengali, South Indian"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Traditional Name</label>
                <input
                  type="text"
                  value={formData.traditionalName}
                  onChange={(e) => handleInputChange('traditionalName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Banarasi Saree, Lehenga Choli"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Cultural Significance</label>
                <textarea
                  value={formData.significance}
                  onChange={(e) => handleInputChange('significance', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  placeholder="Describe the cultural significance, history, or traditional use..."
                />
              </div>
            </div>
          </div>

          {/* AI Preferences */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              AI Generation Preferences
            </h4>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Writing Tone
                </label>
                <select
                  value={formData.tone}
                  onChange={(e) => handleInputChange('tone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                >
                  {tones.map(tone => (
                    <option key={tone.value} value={tone.value}>
                      {tone.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description Length
                </label>
                <select
                  value={formData.length}
                  onChange={(e) => handleInputChange('length', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                >
                  <option value="short">Short (50-100 words)</option>
                  <option value="medium">Medium (100-200 words)</option>
                  <option value="long">Long (200-300 words)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SEO Keywords
                </label>
                <input
                  type="text"
                  value={formData.keywords}
                  onChange={(e) => handleInputChange('keywords', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., ethnic wear, traditional, handmade"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.includeHistory}
                  onChange={(e) => handleInputChange('includeHistory', e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Include cultural history</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.includeCare}
                  onChange={(e) => handleInputChange('includeCare', e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Include care instructions</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
        <button 
          onClick={handleGenerateAI}
          disabled={analyzing}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50"
        >
          {analyzing ? (
            <RefreshCw className="h-5 w-5 animate-spin" />
          ) : (
            <Sparkles className="h-5 w-5" />
          )}
          {analyzing ? 'Generating...' : 'Generate AI Description'}
        </button>
        
        <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          Save as Template
        </button>
      </div>

      {/* AI Analysis Preview */}
      {formData.primaryMaterial && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">AI Analysis Preview</h4>
          <p className="text-green-700 text-sm">
            Based on your inputs, AI will generate a description highlighting: 
            <strong> {formData.primaryMaterial}</strong> material, 
            <strong> {formData.dominantColors}</strong> colors, 
            {formData.patterns && <span>featuring <strong>{formData.patterns}</strong> patterns, </span>}
            suitable for <strong>{formData.occasions.join(', ') || 'various occasions'}</strong>.
          </p>
        </div>
      )}
    </div>
  );
};

export default EnhancedAIInputForm;