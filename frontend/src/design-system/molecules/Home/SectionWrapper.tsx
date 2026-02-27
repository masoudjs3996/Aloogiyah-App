import { ReactNode } from "react";

interface SectionWrapperProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  id?: string;
}
const SectionWrapper = ({
  children,
  title,
  subtitle,
  className = "",
  id,
}: SectionWrapperProps) => {
  return (
    <section id={id} className={`section-padding ${className}`}>
      <div className="container-custom">
        {(title || subtitle) && (
          <div className="mb-12 text-center">
            {title && (
              <h2 className="font-heading text-3xl font-semibold text-foreground md:text-4xl ">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted_foreground">
                {subtitle}
              </p>
            )}
            <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-prymary_green" />
          </div>
        )}
        {children}
      </div>
    </section>
  );
};

export default SectionWrapper;
