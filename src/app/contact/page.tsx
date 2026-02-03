'use client';

import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-5 tracking-tight">Contact Us</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Have questions? We&apos;d love to hear from you. Reach out to us through any of the channels below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contact Info */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8 rounded-2xl shadow-xl">
            <h2 className="text-xl font-bold mb-6">Get In Touch</h2>
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-indigo-600/20 rounded-lg">
                  <MapPin size={20} className="text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Location</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">Westwood Community Arts Center<br />123 Music Lane<br />Westwood, ON N5X 1A2</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-indigo-600/20 rounded-lg">
                  <Phone size={20} className="text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Phone</h3>
                  <p className="text-slate-300 text-sm">(555) 123-4567</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-indigo-600/20 rounded-lg">
                  <Mail size={20} className="text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Email</h3>
                  <p className="text-slate-300 text-sm">hello@westwoodcommunityband.ca</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-indigo-600/20 rounded-lg">
                  <Clock size={20} className="text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Rehearsal Times</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">Tuesdays: 7:00 PM - 9:30 PM<br />Thursdays: 7:00 PM - 9:00 PM (sectionals)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Map Placeholder */}
          <div className="bg-slate-100 rounded-2xl h-56 flex items-center justify-center ring-1 ring-slate-200">
            <div className="text-center text-slate-500">
              <MapPin size={40} className="mx-auto mb-2" />
              <p className="font-medium text-slate-600">Interactive Map</p>
              <p className="text-sm">Would appear here</p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white p-8 rounded-2xl shadow-sm ring-1 ring-slate-900/5">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Send Us a Message</h2>
          <form className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Your Name</label>
              <input type="text" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none placeholder:text-slate-400 text-slate-900 transition-colors" placeholder="Full name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <input type="email" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none placeholder:text-slate-400 text-slate-900 transition-colors" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
              <select className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-slate-900 transition-colors">
                <option value="general">General Inquiry</option>
                <option value="membership">Membership Question</option>
                <option value="booking">Event Booking</option>
                <option value="sponsorship">Sponsorship Opportunity</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Message</label>
              <textarea rows={5} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none placeholder:text-slate-400 text-slate-900 transition-colors" placeholder="Write your message here..." />
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white py-3.5 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/25 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
              <Send size={18} />
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
