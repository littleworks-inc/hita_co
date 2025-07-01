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
  Wand2
} from 'lucide-react';

const EnhancedAIInputForm = () => {
  const [expanded, setExpanded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [formData, setFormData] = useState({
    // Material Details
    primaryMaterial: '',
    secondaryMaterials: '',
    fabricWeight: '',
    fabricTexture: '',
    
    // Design & Style
    designStyle: '',
    patterns: '',
    embellishments: '',
    colorScheme: '',
    dominantColors: '',
    
    // Cultural Context
    culturalOrigin: '',
    traditionalName: '',
    occasions: [],
    significance: '',
    
    // Target Audience
    targetAge: '',
    targetGender: '',
    targetOccasion: '',
    priceRange: '',
    
    // Unique Features
    uniqueFeatures: '',
    craftmanship: '',
    careInstructions: '',
    
    // AI Preferences
    tone: 'elegant',
    length: 'medium',
    keywords: '',
    includeHistory: true,
    includeCare: true
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value) 
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const analyzeImages = async () => {
    setAnalyzing(true);
    // Simulate image analysis
    setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        primaryMaterial: 'Silk',
        secondaryMaterials: 'Gold thread, Cotton lining',
        designStyle: 'Traditional',
        patterns: 'Paisley, Floral motifs',
        dominantColors: 'Deep red, Gold, Ivory',
        colorScheme: 'Rich and warm'
      }));
      setAnalyzing(false);
    }, 2000);
  };

  const occasions = [
    'Wedding', 'Festival', 'Formal Event', 'Casual Wear', 
    'Party', 'Religious Ceremony', 'Cultural Event'
  ];

  const tones = [
    { value: 'elegant', label: 'Elegant & Sophisticated' },
    { value: 'casual', label: 'Casual & Friendly' },
    { value: 'professional', label: 'Professional & Informative' },
    { value: 'romantic', label: 'Romantic & Dreamy' },
    { value: 'modern', label: 'Modern & Trendy' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-purple-600" />
            <div>
              <h2 className="text-xl font-semibold text-purple-900">
                Enhanced AI Product Description Generator
              </h2>
              <p className="text-purple-700 text-sm mt-1">
                Provide detailed information for highly accurate, personalized product descriptions
              </p>
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {expanded ? 'Simple Mode' : 'Detailed Mode'}
          </button>
        </div>
      </div>

      {/* Image Analysis Section */}
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 mb-6">
        <div className="text-center">
          <Camera className="h-8 w-8 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Step 1: Upload Product Images
          </h3>
          <p className="text-gray-600 mb-4">
            AI will analyze your images to automatically detect materials, colors, and design elements
          </p>
          <button
            onClick={analyzeImages}
            disabled={analyzing}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 mx-auto"
          >
            {analyzing ? (
              <>
                <Wand2 className="h-4 w-4 animate-spin" />
                Analyzing Images...
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Analyze Images with AI
              </>
            )}
          </button>
        </div>
      </div>

      {/* Basic Information - Always Visible */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Material Information */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-lg font-medium text-gray-900">
            <Scissors className="h-5 w-5" />
            Material & Fabric
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Material *
            </label>
            <input
              type="text"
              value={formData.primaryMaterial}
              onChange={(e) => handleInputChange('primaryMaterial', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Silk, Cotton, Georgette"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Secondary Materials
            </label>
            <input
              type="text"
              value={formData.secondaryMaterials}
              onChange={(e) => handleInputChange('secondaryMaterials', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Gold thread, Cotton lining, Beads"
            />
          </div>
        </div>

        {/* Color & Design */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-lg font-medium text-gray-900">
            <Palette className="h-5 w-5" />
            Colors & Design
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dominant Colors *
            </label>
            <input
              type="text"
              value={formData.dominantColors}
              onChange={(e) => handleInputChange('dominantColors', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Deep red, Gold, Ivory"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patterns & Motifs
            </label>
            <input
              type="text"
              value={formData.patterns}
              onChange={(e) => handleInputChange('patterns', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Paisley, Floral, Geometric, Traditional motifs"
            />
          </div>
        </div>
      </div>

      {/* Detailed Information - Expandable */}
      {expanded && (
        <div className="space-y-6 border-t border-gray-200 pt-6">
          {/* Target Audience */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-medium text-gray-900">
                <Users className="h-5 w-5" />
                Target Audience
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Age Group
                </label>
                <select
                  value={formData.targetAge}
                  onChange={(e) => handleInputChange('targetAge', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select age group</option>
                  <option value="teens">Teens (13-19)</option>
                  <option value="young-adults">Young Adults (20-30)</option>
                  <option value="adults">Adults (30-50)</option>
                  <option value="mature">Mature (50+)</option>
                  <option value="all-ages">All Ages</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Gender
                </label>
                <select
                  value={formData.targetGender}
                  onChange={(e) => handleInputChange('targetGender', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select gender</option>
                  <option value="women">Women</option>
                  <option value="men">Men</option>
                  <option value="girls">Girls</option>
                  <option value="boys">Boys</option>
                  <option value="unisex">Unisex</option>
                </select>
              </div>
            </div>

            {/* Occasions */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-medium text-gray-900">
                <Heart className="h-5 w-5" />
                Suitable Occasions
              </h3>
              
              <div className="grid grid-cols-2 gap-2">
                {occasions.map(occasion => (
                  <label key={occasion} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.occasions.includes(occasion)}
                      onChange={() => handleArrayChange('occasions', occasion)}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">{occasion}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Cultural Context */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cultural Origin/Region
              </label>
              <input
                type="text"
                value={formData.culturalOrigin}
                onChange={(e) => handleInputChange('culturalOrigin', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Rajasthani, Bengali, South Indian"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Traditional Name (if any)
              </label>
              <input
                type="text"
                value={formData.traditionalName}
                onChange={(e) => handleInputChange('traditionalName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Bandhani, Kalamkari, Chikankari"
              />
            </div>
          </div>

          {/* Unique Features */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unique Features & Craftsmanship
            </label>
            <textarea
              value={formData.uniqueFeatures}
              onChange={(e) => handleInputChange('uniqueFeatures', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Hand-embroidered details, Mirror work, Block printing, Artisan crafted..."
            />
          </div>

          {/* AI Generation Preferences */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="flex items-center gap-2 text-lg font-medium text-gray-900 mb-4">
              <Star className="h-5 w-5" />
              AI Generation Preferences
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
        <button className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all">
          <Sparkles className="h-5 w-5" />
          Generate AI Description
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