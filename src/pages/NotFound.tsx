
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

const NotFound = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-clientblue-700">404</h1>
        <p className="text-2xl mt-4 mb-6">الصفحة غير موجودة</p>
        <Button asChild>
          <Link to="/dashboard">العودة إلى لوحة القيادة</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
