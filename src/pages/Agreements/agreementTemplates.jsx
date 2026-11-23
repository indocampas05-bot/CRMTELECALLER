// src/pages/Agreements/agreementTemplates.js

// ============================================================================
// IMPORTANT
// ============================================================================
//
// DO NOT use one generic MASTER_TEMPLATE_HTML.
//
// The agreement system contains separate original-style documents:
//
// 1. ERP Software Agreement
// 2. Digital Marketing & Admin Dashboard Agreement
//
// When more than one service is selected, the documents are appended as
// separate agreement documents. Their original structure is not merged into
// a generic agreement.
//
// ============================================================================


// ============================================================================
// COMPANY
// ============================================================================

export const COMPANY = {
  name: "INDOCAMPAS TECH PRIVATE LIMITED",

  legalAddress:
    "No. 44, Unicon Plaza 2nd Floor, Kamarajar Salai, Karaikal – 609602",

  phone: "89258 11993 / 8925811994",

  oldPhone: "9944213425 / 7339547987",

  website: "www.indocampas.com",

  branchAddress:
    "TIDAL NEO - Thiruchitrambalam Koot Road, Tamil Nadu 605111",

  digitalCompanyName: "INDOCAMPAS TECHNOLOGIES",
};


// ============================================================================
// LOGO
// ============================================================================
//
// Put the actual logo extracted from your original PDF in:
//
// public/assets/indocampas-logo.png
//
// The file will be loaded as:
// /assets/indocampas-logo.png
//
// If your project already has the logo elsewhere, change only this value.
//

export const INDOCAMPAS_LOGO_SRC =
  "/assets/indocampas-logo.png";


// ============================================================================
// UTILITY
// ============================================================================

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) {
    return new Date()
      .toLocaleDateString("en-GB")
      .replaceAll("/", "-");
  }

  if (value instanceof Date) {
    return value
      .toLocaleDateString("en-GB")
      .replaceAll("/", "-");
  }

  return String(value);
}

function replacePlaceholders(html, values) {
  let result = html;

  Object.entries(values).forEach(([key, value]) => {
    result = result.replaceAll(
      `{{${key}}}`,
      value ?? ""
    );
  });

  return result;
}


// ============================================================================
// COMMON ORIGINAL PDF PAGE DESIGN
// ============================================================================

const COMMON_DOCUMENT_STYLES = `
<style>

  .agreement-document {
    width: 100%;
    box-sizing: border-box;
    font-family: Arial, Helvetica, sans-serif;
    color: #222;
    background: #fff;
  }

  .agreement-page {
    position: relative;
    min-height: 1123px;
    box-sizing: border-box;
    padding: 42px 72px 100px;
    overflow: hidden;
    page-break-after: always;
    break-after: page;
    background:
      linear-gradient(
        180deg,
        #ffffff 0%,
        #fafafa 100%
      );
  }

  .agreement-page:last-child {
    page-break-after: auto;
    break-after: auto;
  }

  /* ---------------------------------------------------------
     TOP DARK BORDER
  --------------------------------------------------------- */

  .agreement-page::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 7px;
    background: #082d40;
  }

  /* ---------------------------------------------------------
     TOP RIGHT ORIGINAL PDF STYLE
  --------------------------------------------------------- */

  .agreement-page::after {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    width: 130px;
    height: 180px;
    background:
      linear-gradient(
        45deg,
        transparent 0 48%,
        #062b3c 49% 100%
      );
    clip-path: polygon(
      20% 0,
      100% 0,
      100% 100%,
      52% 76%,
      100% 48%,
      52% 24%
    );
    opacity: 1;
  }

  .agreement-page h1,
  .agreement-page h2,
  .agreement-page h3,
  .agreement-page h4 {
    color: #222;
  }

  .agreement-page h1 {
    font-size: 20px;
    margin: 0 0 16px;
  }

  .agreement-page h2 {
    font-size: 18px;
    margin: 22px 0 16px;
    font-weight: 700;
  }

  .agreement-page h3 {
    font-size: 15px;
    margin: 18px 0 10px;
    font-weight: 700;
  }

  .agreement-page h4 {
    font-size: 14px;
    margin: 14px 0 8px;
  }

  .agreement-page p {
    font-size: 13px;
    line-height: 1.6;
    margin: 5px 0;
  }

  .agreement-page ul,
  .agreement-page ol {
    padding-left: 28px;
    margin: 7px 0;
  }

  .agreement-page li {
    font-size: 13px;
    line-height: 1.55;
    margin: 5px 0;
  }

  /* ---------------------------------------------------------
     HEADER
  --------------------------------------------------------- */

  .pdf-brand-header {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 26px;
  }

  .pdf-brand-logo {
    width: 250px;
    max-height: 100px;
    object-fit: contain;
    object-position: left center;
  }

  .pdf-brand-text {
    display: none;
  }

  /* ---------------------------------------------------------
     FOOTER
  --------------------------------------------------------- */

  .agreement-footer {
    position: absolute;
    bottom: 22px;
    left: 55px;
    z-index: 3;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 11px;
  }

  .agreement-footer .footer-phone {
    color: #333;
    font-weight: 600;
  }

  .agreement-footer .footer-web {
    color: #365f91;
    font-weight: 600;
  }

  .agreement-footer .footer-address {
    color: #b84a4a;
    font-weight: 600;
  }

  .agreement-footer-decoration {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 105px;
    height: 185px;
    background:
      linear-gradient(
        135deg,
        #072b3b 0 50%,
        #b30d15 50% 100%
      );
    clip-path: polygon(
      0 0,
      100% 34%,
      28% 50%,
      100% 66%,
      100% 100%,
      0 100%
    );
  }

  .section-divider {
    border: 0;
    border-top: 1px solid #9a9a9a;
    margin: 28px 0 20px;
  }

  .agreement-title {
    font-size: 18px !important;
    font-weight: 800 !important;
    text-transform: uppercase;
  }

  .fee-table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 13px;
  }

  .fee-table th,
  .fee-table td {
    border: 1px solid #333;
    padding: 8px;
    text-align: left;
  }

  .fee-table th {
    font-weight: 700;
  }

  .signature-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 80px;
    margin-top: 40px;
  }

  .signature-box {
    min-height: 180px;
  }

  .signature-line {
    margin-top: 55px !important;
    border-top: 1px solid #222;
    width: 190px;
  }

  @media print {

    .agreement-page {
      width: 210mm;
      min-height: 297mm;
      page-break-after: always;
      break-after: page;
    }

    .agreement-page:last-child {
      page-break-after: auto;
      break-after: auto;
    }

  }

</style>
`;


// ============================================================================
// COMMON ORIGINAL PDF HEADER
// ============================================================================

function getOriginalHeader() {
  return `
    <div class="pdf-brand-header">
      <img
        src="${INDOCAMPAS_LOGO_SRC}"
        class="pdf-brand-logo"
        alt="Indocampas Tech"
      />
    </div>
  `;
}


// ============================================================================
// COMMON ORIGINAL PDF FOOTER
// ============================================================================

function getOriginalFooter() {
  return `
    <div class="agreement-footer-decoration"></div>

    <div class="agreement-footer">
      <div class="footer-phone">
        ☎ ${COMPANY.phone}
      </div>

      <div class="footer-web">
        ◉ ${COMPANY.website}
      </div>

      <div class="footer-address">
        ● TIDAL NEO - Thiruchitrambalam<br/>
        &nbsp;&nbsp;&nbsp; Koot Road, Tamil Nadu 605111
      </div>
    </div>
  `;
}


// ============================================================================
// DIGITAL MARKETING & ADMIN DASHBOARD AGREEMENT
// ORIGINAL 6-PAGE PDF STRUCTURE
// ============================================================================

export const DIGITAL_MARKETING_TEMPLATE_HTML = `
${COMMON_DOCUMENT_STYLES}

<div class="agreement-document">

  <!-- PAGE 1 -->

  <section class="agreement-page">

    ${getOriginalHeader()}

    <h2 class="agreement-title">
      DIGITAL MARKETING &amp; ADMIN DASHBOARD AGREEMENT
    </h2>

    <p>
      This Digital Marketing &amp; ADMIN DASHBOARD AGREEMENT is made on
      <strong>{{agreement_date}}</strong>
    </p>

    <h3>BY AND BETWEEN</h3>

    <p>
      <strong>INDOCAMPAS TECHNOLOGIES</strong>, having its Branch office at
      TIDAL NEO - Thiruchitrambalam-Koot Road, Tamil Nadu 605111
      (hereinafter referred to as the “Service Provider”, which expression
      shall include its successors and assigns)
    </p>

    <h3>AND</h3>

    <p>
      <strong>{{client_name}}</strong>, having its
      <strong>{{client_address}}</strong>
      (hereinafter referred to as the “Client”, which expression shall include
      its management, trustees, successors and permitted assigns)
    </p>

    <p>
      The Service Provider and Client are collectively referred to as the
      “Parties”.
    </p>

    <hr class="section-divider"/>

    <h3>1. SCOPE OF SERVICES</h3>

    <p>The Service Provider shall provide:</p>

    <ul>
      <li>
        Social Media Management
        (Facebook, Instagram, YouTube, WhatsApp Promotions)
      </li>

      <li>Meta Ads Campaign Management</li>

      <li>Admission Promotion Campaigns</li>

      <li>Creative Designing &amp; Content Creation</li>

      <li>
        Access to Admission Management Dashboard
        ({{admission_dashboard_amount}})
      </li>
    </ul>

    ${getOriginalFooter()}

  </section>


  <!-- PAGE 2 -->

  <section class="agreement-page">

    ${getOriginalHeader()}

    <h3>2. TERM</h3>

    <p>
      Minimum contract period: 1 (one Year).
    </p>

    <p>
      Agreement auto-renews unless 30 days written termination notice is given.
    </p>

    <p>
      Early termination before minimum period requires payment of remaining
      contract fees.
    </p>

    <hr class="section-divider"/>

    <h3>3. SERVICE FEES</h3>

    <p>
      <strong>Yearly Professional Fee: {{digital_yearly_fee}}</strong>
    </p>

    <p>
      <strong>Special Discount: {{digital_discount}}</strong>
    </p>

    <p>
      <strong>Net Payable Fee: {{digital_amount}}</strong>
    </p>

    <p>
      Exclusive for GST: {{digital_gst}}.
    </p>

    <p><strong>Payment Terms:</strong></p>

    <ul>
      <li>2% monthly interest on delayed payments</li>
      <li>Services may be suspended for non-payment</li>
    </ul>

    <p>
      Advertisement budget is separate and payable by Client.
    </p>

    <hr class="section-divider"/>

    <h3>5. ADMISSION DASHBOARD ({{admission_dashboard_amount}})</h3>

    <p>
      <strong>5.1</strong>
      The Service Provider shall provide its proprietary Admission Management
      Dashboard free of cost during contract validity.
    </p>

    <p>
      <strong>5.2</strong>
      The Dashboard shall record all leads, enquiries, applications, and
      admissions.
    </p>

    <p>
      <strong>5.3</strong>
      Dashboard data logs shall be final and legally binding for admission
      count.
    </p>

    ${getOriginalFooter()}

  </section>


  <!-- PAGE 3 -->

  <section class="agreement-page">

    ${getOriginalHeader()}

    <h3>6. PER-ADMISSION COMMISSION STRUCTURE</h3>

    <p>
      <strong>6.1</strong>
      The Client agrees to pay:
    </p>

    <p>
      <strong>
        {{commission_without_erp}} per Confirmed Admission generated through
        Dashboard.
      </strong>
    </p>

    <p>
      <strong>6.2</strong>
      If Client subscribes to ERP Software of Service Provider:
    </p>

    <p>
      <strong>
        Commission reduced to {{commission_with_erp}}
        per Confirmed Admission.
      </strong>
    </p>

    <p>
      <strong>6.3</strong>
      “Confirmed Admission” means student completes admission process and pays
      admission/term fees.
    </p>

    <p>
      <strong>6.4</strong>
      Commission invoices raised monthly and payable within 5 days.
    </p>

    <p>
      <strong>6.5</strong>
      2% monthly interest on delayed commission payment.
    </p>

    <hr class="section-divider"/>

    <h3>7. NON-BYPASS &amp; ANTI-MANIPULATION CLAUSE</h3>

    <p>
      <strong>7.1</strong>
      Client shall not bypass, suppress, manipulate, or process Dashboard leads
      outside system.
    </p>

    <p>
      <strong>7.2</strong>
      Any admission generated through campaigns must be entered in Dashboard.
    </p>

    <p>
      <strong>7.3</strong>
      Attempt to conceal admissions to avoid commission is material breach.
    </p>

    <p>
      <strong>7.4</strong>
      Service Provider reserves right to audit admission records.
    </p>

    <hr class="section-divider"/>

    <h3>9. INTELLECTUAL PROPERTY</h3>

    <p>
      All creatives, strategies, systems, dashboard technology remain exclusive
      property of Service Provider.
    </p>

    <p>
      Usage rights granted only upon full payment.
    </p>

    ${getOriginalFooter()}

  </section>


  <!-- PAGE 4 -->

  <section class="agreement-page">

    ${getOriginalHeader()}

    <h3>10. CONFIDENTIALITY</h3>

    <p>
      Both parties agree to maintain confidentiality of:
    </p>

    <ul>
      <li>Student data</li>
      <li>Marketing strategy</li>
      <li>Financial details</li>
      <li>Dashboard system</li>
    </ul>

    <p>This clause survives termination.</p>

    <hr class="section-divider"/>

    <h3>12. FORCE MAJEURE</h3>

    <p>No liability for delays caused by:</p>

    <ul>
      <li>Government regulations</li>
      <li>Platform policy changes</li>
      <li>Natural disasters</li>
      <li>Technical disruptions</li>
    </ul>

    <hr class="section-divider"/>

    <h3>13. TERMINATION</h3>

    <p>30 days written notice required.</p>

    <p>Advance payments are non-refundable.</p>

    ${getOriginalFooter()}

  </section>


  <!-- PAGE 5 -->

  <section class="agreement-page">

    ${getOriginalHeader()}

    <p>
      Commission payable for all leads generated during contract period,
      even if admission confirmed after termination.
    </p>

    <hr class="section-divider"/>

    <h3>14. NON-COMPETE &amp; NON-SOLICITATION</h3>

    <p>
      During agreement period and 12 months thereafter:
    </p>

    <p>
      Client shall not copy, replicate, or engage third party to duplicate
      Dashboard system structure.
    </p>

    <hr class="section-divider"/>

    <h3>16. ENTIRE AGREEMENT</h3>

    <p>
      This Agreement supersedes all prior communications.
    </p>

    <hr class="section-divider"/>

    <h3>SIGNATURES</h3>

    <div class="signature-grid">

      <div class="signature-box">

        <p>
          For <strong>INDOCAMPAS TECHNOLOGIES</strong>
        </p>

        <p>Authorized Signatory</p>

        <p>Name: __________________</p>

        <p>Signature: ______________</p>

        <p>Date: ___________________</p>

      </div>


      <div class="signature-box">

        <p>
          For <strong>{{client_name}}</strong>
        </p>

        <p>Authorized Signatory</p>

        <p>Name: __________________</p>

        <p>Signature: ______________</p>

        <p>Date: ___________________</p>

      </div>

    </div>

    ${getOriginalFooter()}

  </section>

</div>
`;


// ============================================================================
// ERP AGREEMENT
//
// IMPORTANT:
// This is NOT the Digital Marketing agreement converted into ERP.
//
// This follows the original ERP agreement content and separate document flow.
//
// The original ERP PDF contains:
// - Purpose
// - Framework
// - Modules
// - Scope of Services
// - Student Information
// - Academic Management
// - Teacher & Staff Management
// - Parent Engagement
// - Administration
// - Reporting
// - Security
// - Support
// - Term
// - Fees
// - Provider Obligations
// - Client Obligations
// - Confidentiality
// - Intellectual Property
// - Termination
// - Limitation of Liability
// - Force Majeure
// - Dispute Resolution
// - Entire Agreement
// - Signatures
//
// ============================================================================

export const ERP_TEMPLATE_HTML = `
${COMMON_DOCUMENT_STYLES}

<div class="agreement-document">


  <!-- PAGE 1 -->

  <section class="agreement-page">

    ${getOriginalHeader()}

    <h3>BETWEEN</h3>

    <p>
      <strong>INDOCAMPAS TECH PRIVATE LIMITED</strong>,
      a company incorporated under the Companies Act, 2013,
      having its registered office at
      ${COMPANY.legalAddress}.
      Hereinafter referred to as the “Service Provider”
      (which expression shall, unless repugnant to the context,
      mean and include its successors, assigns, and representatives)
    </p>

    <h3>AND</h3>

    <p>
      <strong>{{client_name}}</strong>,
      a private educational institution, having its address at
      <strong>{{client_address}}</strong>
      hereinafter referred to as the “Educational Institution”
      (which expression shall, unless repugnant to the context,
      mean and include its administrators, representatives and assigns).
    </p>

    <h3>1. PURPOSE OF THE AGREEMENT</h3>

    <p>
      The Service Provider agrees to provide, and the Client educational
      institutes agrees to use, a cloud-based educational institutes management
      web dashboard and mobile application (“Services”) developed and maintained
      by Indocampas Tech Pvt. Ltd., for educational institutes management and
      communication purposes.
    </p>

    <p>
      The following terms and conditions constitute a permit agreement
      (“Terms and Conditions” or “Permit Agreement” or “Terms of Use”)
      between you (“You” or “Your” or “User” or “Permittee”) and Provider.
      By clicking the ‘Accept’ or similar options and registering and subscribing
      to the Software as a Service SAAS Product, the Permittee agrees to this
      Permit Agreement along with the Subscription Agreement.
    </p>

    <h3>I. Overview</h3>

    <h4>A. Framework</h4>

    <ul>
      <li>
        Only Indocampas provides digital framework for self-management all
        private educational institutes other than Syllabus through this application.
      </li>

      <li>
        The framework includes modules for student management, academic planning
        and performance tracking and parents’ response and education-oriented activity.
      </li>

      <li>
        Indocampas Tech Pvt Ltd Company has developed SAAS Product for private
        educational institutes in four categories.
      </li>
    </ul>

    <ol>
      <li>Super Admin</li>
      <li>Educational Institution Admin</li>
      <li>Teachers’ Application</li>
      <li>Parent and Student Application</li>
    </ol>

    <p>
      <strong>
        User Role-Based Views:
        Admin | Teacher | Student | Parent
      </strong>
    </p>

    ${getOriginalFooter()}

  </section>


  <!-- PAGE 2 -->

  <section class="agreement-page">

    ${getOriginalHeader()}

    <h4>Quick Stats Panel</h4>

    <ul>
      <li>Total Students / Teachers / Classes</li>
      <li>Today's Attendance</li>
      <li>Upcoming Events</li>
      <li>Notifications</li>
    </ul>

    <h3>B. Modules</h3>

    <h4>a. Academic Management</h4>

    <ul>
      <li>Class &amp; Section Management</li>
      <li>Subject Allocation</li>
      <li>
        Timetable Generator including Class and Exam Timetables
      </li>
    </ul>

    <h4>b. Student Information System (SIS)</h4>

    <ul>
      <li>
        Student Profiles – ID, Contact and Parent Information
      </li>

      <li>
        Enrolment Management – online/offline admissions through dashboard/app
      </li>
    </ul>

    <h4>c. Teacher Management</h4>

    <ul>
      <li>Staff Directory</li>
      <li>Teacher Timetables</li>
      <li>Leave Requests &amp; Approvals</li>
      <li>Performance Evaluation</li>
    </ul>

    <h4>d. Examination &amp; Assessment</h4>

    <ul>
      <li>Exam Scheduler</li>
      <li>Mark Entry &amp; Grade Book</li>
      <li>Result Analysis</li>
    </ul>

    <h4>e. Attendance Management</h4>

    <ul>
      <li>Daily Student Attendance</li>
      <li>Daily Staff Attendance</li>
    </ul>

    <h4>f. Fees &amp; Finance</h4>

    <ul>
      <li>Fee Structure Setup</li>
      <li>Online Payment Gateway Integration</li>
      <li>Dues &amp; Discount Management</li>
      <li>Invoice Generator</li>
      <li>Financial Reports &amp; Ledgers</li>
      <li>Fee Collection Method</li>
    </ul>

    ${getOriginalFooter()}

  </section>


  <!-- PAGE 3 -->

  <section class="agreement-page">

    ${getOriginalHeader()}

    <h4>g. Communication &amp; Notifications</h4>

    <ul>
      <li>SMS / Email / Push Notifications</li>
      <li>Notice Board</li>
      <li>Chat Interface</li>
    </ul>

    <h4>i. Canteen / Hostel / Transport</h4>

    <p>
      Only van-notifications will be provided through the App.
      No live tracking or attendance view is included in this module.
    </p>

    <h4>j. Assignments &amp; Homework</h4>

    <ul>
      <li>Upload Homework</li>
      <li>Submission Tracker</li>
    </ul>

    <h4>C. User Management &amp; Security</h4>

    <ul>
      <li>Role-Based Access Controls (RBAC)</li>
      <li>Login History &amp; Session Logs</li>
    </ul>

    <h4>D. Reports &amp; Analytics</h4>

    <ul>
      <li>Attendance Reports</li>
      <li>Fee Collection Reports</li>
    </ul>

    <h4>E. Settings &amp; Configuration</h4>

    <ul>
      <li>Educational Institution Information</li>
    </ul>

    <h4>F. Key Components</h4>

    <ul>
      <li>
        Educational Institution, Teacher and Student Information System
      </li>

      <li>
        Internal accounts management through Admin Dashboard
      </li>

      <li>
        Class and Examination Timetables
      </li>

      <li>
        Digital Attendance for Teachers and Students
      </li>

      <li>
        Parent App support
      </li>
    </ul>

    <h4>G. Benefits</h4>

    <ul>
      <li>Streamlined Operations</li>
      <li>Data-driven Insights</li>
      <li>Enhanced Collaboration</li>
    </ul>

    ${getOriginalFooter()}

  </section>


  <!-- PAGE 4 -->

  <section class="agreement-page">

    ${getOriginalHeader()}

    <h4>H. Customization</h4>

    <p>
      This INDOCAMPAS tech application cannot be customized individually.
      INDOCAMPAS tech application is divided into three categories for
      educational institutions:
    </p>

    <ol>
      <li>PRO</li>
      <li>PRO Plus</li>
      <li>PRO Max</li>
    </ol>

    <h3>2. SCOPE OF SERVICES</h3>

    <p>
      The Services provided by the Provider through its Play Store,
      App Store or Website are (“Services” or “SAAS Product”).
    </p>

    <p>
      The Provider has developed a cloud-based platform which is used for
      maintaining records and facilitating educational institution processes
      from admission through student management, academic management,
      timetables, attendance, examination details, results, transport,
      events, fees and other institutional activities.
    </p>

    <h4>I. Student Information Management</h4>

    <ul>
      <li>Student Profile Management</li>
      <li>Admission and Enrollment Management</li>
      <li>Student Tracking</li>
      <li>Student Performance Monitoring</li>
    </ul>

    <h4>II. Academic Management</h4>

    <ul>
      <li>Class and Section Management</li>
      <li>Subject and Syllabus Management</li>
      <li>Exam, Fees and Assessment Management</li>
      <li>Grade and Report Card Management</li>
    </ul>

    <h4>III. Teacher and Staff Management</h4>

    <ul>
      <li>Teacher and Staff Profile Management</li>
      <li>Class and Subject Assignment Management</li>
      <li>Attendance and Leave Management</li>
      <li>Role-Based Access</li>
      <li>Sub-profile Management</li>
    </ul>

    ${getOriginalFooter()}

  </section>


  <!-- PAGE 5 -->

  <section class="agreement-page">

    ${getOriginalHeader()}

    <h4>IV. Parent and Student Engagement</h4>

    <ul>
      <li>Parent-Teacher Communication</li>
      <li>Student Portal for Assignments and Grades</li>
      <li>Parent Portal for Student Progress Tracking</li>
      <li>Parent Teachers’ Meetings</li>
    </ul>

    <h4>V. Administrative Management</h4>

    <ul>
      <li>Fee Management and Payment Tracking</li>
      <li>Inventory Management</li>
      <li>Transport Management</li>
      <li>Hostel Management</li>
    </ul>

    <h4>VI. Reporting and Analytics</h4>

    <ul>
      <li>Real-time Dashboards</li>
      <li>Customizable Reports</li>
      <li>Export to PDF, Excel and CSV</li>
      <li>Attendance and Fee Collection Reports</li>
    </ul>

    <h4>VII. Integration and Security</h4>

    <ul>
      <li>Third-party Integration</li>
      <li>Data Security and Backup</li>
      <li>User Access Control and Authentication</li>
    </ul>

    <h4>VIII. Support and Maintenance</h4>

    <ul>
      <li>Regular Updates and Maintenance</li>
      <li>Feature Enhancements</li>
      <li>Technical Support and Troubleshooting</li>
      <li>Customer Support</li>
      <li>Training Resources and User Manuals</li>
    </ul>

    <h4>Services Not Included</h4>

    <ul>
      <li>On-premise installation</li>
      <li>Custom development beyond standard features</li>
      <li>Hardware provisioning</li>
      <li>Data migration beyond initial onboarding</li>
      <li>Legal, financial or educational consulting services</li>
    </ul>

    <h3>3. TERM</h3>

    <p>
      This Agreement shall be valid for an initial period of 12 months
      commencing from the date of signing and may be renewed.
    </p>

    <h4>3.1 Initial Term</h4>

    <p>
      The Agreement shall continue in force for an initial period of one
      (1) year unless terminated earlier.
    </p>

    <h4>3.2 Renewal</h4>

    <p>
      The Agreement automatically renews for successive periods of one year
      unless either party provides written notice of non-renewal at least
      30 days before the end of the current term.
    </p>

    <h4>3.3 Termination</h4>

    <p>
      Either party may terminate as provided in this Agreement.
    </p>

    ${getOriginalFooter()}

  </section>


  <!-- PAGE 6 : FEES -->

  <section class="agreement-page">

    ${getOriginalHeader()}

    <h3>FEES AND PAYMENT TERMS</h3>

    <h4>4.1 Trial Terms</h4>

    <ul>
      <li>
        Educational institutions may examine available features during
        the applicable trial period.
      </li>

      <li>
        Extension requests may be approved or refused by INDOCAMPAS.
      </li>

      <li>
        After trial completion, the educational institution may terminate
        or continue on a paid account.
      </li>
    </ul>

    <h4>4.2 Subscription Billing</h4>

    <ul>
      <li>INDOCAMPAS operates on a subscription basis.</li>
      <li>
        Subscription fees are charged annually depending on selected plan.
      </li>
      <li>
        Billing begins upon account activation or renewal.
      </li>
      <li>
        Services are billed in advance on a yearly basis.
      </li>
      <li>
        Fees are calculated based on the selected subscription and applicable
        student strength.
      </li>
    </ul>

    <p>
      All fees are exclusive of taxes unless specifically mentioned otherwise.
    </p>

    <h3>
      ERP Software Subscription Charges
    </h3>

    <table class="fee-table">

      <thead>
        <tr>
          <th>Description</th>
          <th>Amount</th>
        </tr>
      </thead>

      <tbody>

        <tr>
          <td>Selected ERP Plan</td>
          <td>{{erp_plan_label}}</td>
        </tr>

        <tr>
          <td>Total Strength</td>
          <td>{{erp_total_strength}}</td>
        </tr>

        <tr>
          <td>Price</td>
          <td>{{erp_amount}}</td>
        </tr>

        <tr>
          <td>GST</td>
          <td>{{erp_gst}}</td>
        </tr>

        <tr>
          <td>
            <strong>Total Amount Payable</strong>
          </td>

          <td>
            <strong>{{erp_total_amount}}</strong>
          </td>
        </tr>

      </tbody>

    </table>

    <h4>4.3 Mode of Payment</h4>

    <ul>
      <li>Credit / Debit Cards</li>
      <li>UPI / Net Banking</li>
      <li>Payment Gateway</li>
      <li>Direct Bank Transfer</li>
    </ul>

    <h4>Late Payment</h4>

    <ul>
      <li>
        2% per month late payment fee may be charged.
      </li>

      <li>
        Access may be suspended or limited until dues are cleared.
      </li>

      <li>
        Accounts may be terminated after continued non-payment.
      </li>
    </ul>

    <h4>4.5 Taxes</h4>

    <p>
      Applicable taxes shall be borne by the School as per prevailing laws.
    </p>

    <h4>4.6 Fee Revision</h4>

    <p>
      The Service Provider reserves the right to revise fees annually with
      prior written notice.
    </p>

    <h4>4.7 Refund Policy</h4>

    <p>
      Unless otherwise specified, fees paid are non-refundable subject to
      applicable terms of this Agreement.
    </p>

    ${getOriginalFooter()}

  </section>


  <!-- PAGE 7 : PROVIDER OBLIGATIONS -->

  <section class="agreement-page">

    ${getOriginalHeader()}

    <h3>5. OBLIGATION OF THE SERVICE PROVIDER</h3>

    <p>
      The Service Provider agrees to undertake the following responsibilities:
    </p>

    <h4>5.1 Web Dashboard Provision</h4>

    <p>
      Provide access to the Indocampas Schooling Web Dashboard platform,
      including all features available under the selected package.
    </p>

    <p>
      Ensure access except during scheduled maintenance.
    </p>

    <h4>5.2 Implementation and Deployment</h4>

    <p>
      Complete the initial setup and agreed configuration.
    </p>

    <h4>5.3 Training and Support</h4>

    <ul>
      <li>Provide adequate staff training</li>
      <li>Provide technical support</li>
      <li>Resolve technical issues as applicable</li>
    </ul>

    <h4>5.4 Data Security and Privacy</h4>

    <p>
      Student, staff and institutional data shall be stored securely and
      handled according to applicable data protection requirements.
    </p>

    <h4>5.5 Updates and Maintenance</h4>

    <ul>
      <li>Regular updates</li>
      <li>Bug fixes</li>
      <li>Feature improvements</li>
      <li>Scheduled maintenance</li>
    </ul>

    <h4>5.6 Compliance</h4>

    <p>
      The Service Provider shall comply with applicable laws relating to
      service delivery and data handling.
    </p>

    <h4>5.7 Performance Warranty</h4>

    <p>
      The platform will substantially function according to agreed features
      during the term of this Agreement.
    </p>

    ${getOriginalFooter()}

  </section>


  <!-- PAGE 8 : CLIENT OBLIGATIONS -->

  <section class="agreement-page">

    ${getOriginalHeader()}

    <h3>6. OBLIGATION OF THE CLIENT SCHOOL</h3>

    <h4>6.1 Access and Cooperation</h4>

    <p>
      The School shall provide timely access to relevant data, staff,
      infrastructure and resources required for setup and deployment.
    </p>

    <h4>6.2 Payment of Fees</h4>

    <p>
      The School shall pay applicable fees and charges according to the
      Fees and Payment Terms.
    </p>

    <h4>6.3 Use of Web Dashboard</h4>

    <ul>
      <li>
        Use the Indocampas platform only for internal school purposes.
      </li>

      <li>
        Prevent unauthorized access.
      </li>

      <li>
        Ensure responsible use by staff.
      </li>
    </ul>

    <h4>Infrastructure Support</h4>

    <p>
      The School shall provide required hardware and internet connectivity.
    </p>

    <h4>6.5 Data Accuracy</h4>

    <p>
      All information provided by the School shall be accurate,
      complete and updated.
    </p>

    <h4>6.6 Confidentiality</h4>

    <p>
      The School shall maintain confidentiality of credentials and sensitive
      information.
    </p>

    <h4>6.7 Legal and Ethical Use</h4>

    <p>
      The platform shall not be used for illegal, abusive or harmful activity.
    </p>

    ${getOriginalFooter()}

  </section>


  <!-- PAGE 9 : CONFIDENTIALITY -->

  <section class="agreement-page">

    ${getOriginalHeader()}

    <h3>7. CONFIDENTIALITY</h3>

    <h4>7.1 Definition of Confidential Information</h4>

    <p>
      Confidential Information includes all written, electronic or oral
      information disclosed between the parties, including:
    </p>

    <ul>
      <li>Student, Staff and Administrative Data</li>
      <li>Financial Information and Pricing</li>
      <li>Technical Details and Specifications</li>
      <li>Business Strategies and Internal Communications</li>
      <li>Usernames, Passwords and Access Details</li>
    </ul>

    <h4>Exceptions</h4>

    <p>
      Confidentiality obligations do not apply to information that becomes
      publicly available without breach, is lawfully received from another
      source, is independently developed or is required to be disclosed by law.
    </p>

    <h4>7.4 Duration</h4>

    <p>
      Confidentiality obligations survive termination for three years.
    </p>

    <h4>7.5 Return or Destruction of Information</h4>

    <p>
      Upon termination, confidential information shall be returned or destroyed
      except where retention is legally required.
    </p>

    ${getOriginalFooter()}

  </section>


  <!-- PAGE 10 : INTELLECTUAL PROPERTY -->

  <section class="agreement-page">

    ${getOriginalHeader()}

    <h3>8. INTELLECTUAL PROPERTY RIGHTS</h3>

    <p>
      All rights, titles and interests in the web dashboard and mobile
      application remain the sole property of Indocampas Tech Pvt. Ltd.
    </p>

    <h4>8.1 Ownership by Service Provider</h4>

    <p>
      Copyrights, trademarks, patents, trade secrets, platform code,
      design elements, interfaces and documentation remain exclusive
      property of the Service Provider.
    </p>

    <h4>8.2 License to Use</h4>

    <p>
      The School receives a non-exclusive, non-transferable and limited
      license to use the platform for internal educational and administrative
      purposes during the Agreement term.
    </p>

    <h4>8.3 Restrictions</h4>

    <ul>
      <li>Copying or modifying the platform is prohibited.</li>
      <li>Reverse engineering is prohibited.</li>
      <li>Commercial resale is prohibited.</li>
      <li>Proprietary notices may not be removed.</li>
    </ul>

    <h4>8.4 School Data</h4>

    <p>
      Student, staff, academic and operational data uploaded by the School
      remains the property of the School.
    </p>

    <h4>Developed Customizations</h4>

    <p>
      Custom features may be owned or licensed according to written agreement.
    </p>

    <h4>8.6 Infringement</h4>

    <p>
      The Service Provider warrants that the platform does not knowingly
      infringe applicable third-party intellectual property rights.
    </p>

    ${getOriginalFooter()}

  </section>


  <!-- PAGE 11 : TERMINATION -->

  <section class="agreement-page">

    ${getOriginalHeader()}

    <h3>9. TERMINATION</h3>

    <h4>9.1 Termination for Convenience</h4>

    <p>
      Either party may terminate after the Initial Term by providing
      thirty (30) days prior written notice.
    </p>

    <h4>9.2 Termination for Cause</h4>

    <p>
      Either party may terminate for material breach, insolvency or
      unlawful or unethical activity.
    </p>

    <h4>9.3 Immediate Termination</h4>

    <p>
      The Service Provider may terminate immediately in cases including
      continued non-payment, misuse, tampering or unauthorized access.
    </p>

    <h4>9.4 Consequences of Termination</h4>

    <ul>
      <li>School shall stop using the platform.</li>
      <li>Outstanding dues become payable.</li>
      <li>
        Final data export may be provided upon written request where applicable.
      </li>
      <li>
        Confidential Information shall be returned or securely destroyed.
      </li>
    </ul>

    <h4>9.5 Survival</h4>

    <p>
      Confidentiality, Intellectual Property, Limitation of Liability and
      other provisions that should survive termination remain enforceable.
    </p>

    ${getOriginalFooter()}

  </section>


  <!-- PAGE 12 : LIABILITY + FORCE MAJEURE -->

  <section class="agreement-page">

    ${getOriginalHeader()}

    <h3>10. LIMITATION OF LIABILITY</h3>

    <h4>10.1 Exclusion of Indirect Damages</h4>

    <p>
      Neither party shall be liable for indirect, incidental, special,
      punitive or consequential damages to the maximum extent permitted by law.
    </p>

    <h4>10.2 Cap on Liability</h4>

    <p>
      Except where otherwise required by applicable law, aggregate liability
      shall be limited according to the Agreement terms.
    </p>

    <h4>10.3 Data Loss</h4>

    <p>
      The Service Provider shall take reasonable measures to protect data but
      is not responsible for loss caused by events beyond reasonable control.
    </p>

    <h4>10.4 No Warranty of Uninterrupted Service</h4>

    <p>
      The Service Provider does not guarantee uninterrupted or error-free
      operation during maintenance, upgrades or unforeseen disruptions.
    </p>

    <h3>11. FORCE MAJEURE</h3>

    <p>
      Neither party is liable for failure caused by events beyond reasonable
      control, including:
    </p>

    <ul>
      <li>Natural Disasters</li>
      <li>Epidemics or Pandemics</li>
      <li>Government Actions</li>
      <li>War or Civil Disturbances</li>
      <li>Cyber-attacks or Internet Outages</li>
      <li>Labor Strikes</li>
      <li>Power or Utility Disruptions</li>
    </ul>

    ${getOriginalFooter()}

  </section>


  <!-- PAGE 13 : DISPUTE RESOLUTION -->

  <section class="agreement-page">

    ${getOriginalHeader()}

    <h4>11.2 Notification and Mitigation</h4>

    <p>
      The affected party shall notify the other party and take reasonable
      steps to mitigate the impact.
    </p>

    <h4>11.3 Suspension of Obligations</h4>

    <p>
      Obligations affected by Force Majeure may be suspended during the
      applicable event.
    </p>

    <h4>11.4 Right to Terminate</h4>

    <p>
      Extended Force Majeure events may permit termination according to
      applicable notice requirements.
    </p>

    <h3>12. DISPUTE RESOLUTION</h3>

    <h4>12.1 Amicable Settlement</h4>

    <p>
      Parties shall first attempt to resolve disputes through good faith
      negotiations.
    </p>

    <h4>12.2 Mediation</h4>

    <p>
      Unresolved disputes may proceed to mediation.
    </p>

    <h4>12.3 Arbitration</h4>

    <p>
      If mediation fails, disputes may be resolved through binding arbitration
      under the Arbitration and Conciliation Act, 1996.
    </p>

    <ul>
      <li>Sole arbitrator mutually appointed by the parties.</li>
      <li>Venue: Puducherry.</li>
      <li>Language: English.</li>
      <li>Decision is final and binding.</li>
    </ul>

    <h4>12.4 Jurisdiction and Governing Law</h4>

    <p>
      This Agreement shall be governed by the laws of India.
      Subject to applicable arbitration provisions, courts of Puducherry
      shall have jurisdiction.
    </p>

    ${getOriginalFooter()}

  </section>


  <!-- PAGE 14 : ENTIRE AGREEMENT + SIGNATURE -->

  <section class="agreement-page">

    ${getOriginalHeader()}

    <h3>13. ENTIRE AGREEMENT</h3>

    <p>
      This Agreement including annexures, schedules and attachments constitutes
      the entire agreement between Indocampas Tech Private Limited and the
      Client School and supersedes previous discussions, proposals,
      negotiations and agreements.
    </p>

    <p>
      No amendment, modification or waiver shall be valid unless made in
      writing and signed by both parties.
    </p>

    <p>
      Each party acknowledges that it enters into this Agreement based on
      the terms contained herein.
    </p>

    <div style="height: 40px"></div>

    <h3>
      IN WITNESS WHEREOF
    </h3>

    <p>
      The parties have executed this Agreement on the date first written above.
    </p>

    <div class="signature-grid">

      <div class="signature-box">

        <p>Signature:</p>

        <div class="signature-line"></div>

        <p>
          <strong>For INDOCAMPAS TECH PVT. LTD.</strong>
        </p>

        <p>
          {{company_signatory_name}}
        </p>

        <p>
          {{company_signatory_title}}
        </p>

      </div>


      <div class="signature-box">

        <p>Signature:</p>

        <div class="signature-line"></div>

        <p>
          <strong>For: {{client_name}}</strong>
        </p>

        <p>
          {{client_signatory_name}}
        </p>

        <p>
          {{client_signatory_title}}
        </p>

      </div>

    </div>

    ${getOriginalFooter()}

  </section>


</div>
`;


// ============================================================================
// SERVICE MODULE CONFIGURATION
// ============================================================================

export const SERVICE_MODULES = {

  admissionDashboard: {
    key: "admissionDashboard",

    label: "Admission Dashboard",

    defaultAmount: "NO COST",

    commissionWithoutErp: "₹2,000",

    commissionWithErp: "₹1,000",
  },


  digitalMarketing: {
    key: "digitalMarketing",

    label: "Digital Marketing Package",

    yearlyFee: "₹23,000",

    discount: "₹7,000",

    defaultAmount: "₹16,000",

    gst: "18%",
  },


  erp: {
    key: "erp",

    label: "ERP Software",

    plans: {

      erpPro: {
        label: "Pro Plan",
        defaultAmount: "₹10,000",
      },

      erpProPlus: {
        label: "Pro Plus Plan",
        defaultAmount: "₹18,000",
      },

      erpProMax: {
        label: "Pro Max Plan",
        defaultAmount: "₹28,000",
      },

    },
  },

};


// ============================================================================
// BUILD DIGITAL MARKETING AGREEMENT
// ============================================================================

export function buildDigitalMarketingAgreementHtml(
  selectedServices = {},
  amounts = {},
  lead = {},
  agreementData = {},
) {

  const digitalModule =
    SERVICE_MODULES.digitalMarketing;

  const admissionModule =
    SERVICE_MODULES.admissionDashboard;

  const digitalAmount =
    amounts.digitalMarketing ||
    digitalModule.defaultAmount;

  const admissionAmount =
    selectedServices.admissionDashboard
      ? (
          amounts.admissionDashboard ||
          admissionModule.defaultAmount
        )
      : admissionModule.defaultAmount;

  return replacePlaceholders(
    DIGITAL_MARKETING_TEMPLATE_HTML,
    {

      agreement_date:
        escapeHtml(
          formatDate(
            agreementData.date ||
            agreementData.agreementDate ||
            new Date()
          )
        ),

      client_name:
        escapeHtml(
          lead?.name ||
          lead?.school ||
          lead?.schoolName ||
          agreementData?.clientName ||
          ""
        ),

      client_address:
        escapeHtml(
          lead?.schoolAddress ||
          lead?.address ||
          agreementData?.clientAddress ||
          ""
        ),

      admission_dashboard_amount:
        escapeHtml(admissionAmount),

      digital_yearly_fee:
        escapeHtml(
          amounts.digitalYearlyFee ||
          digitalModule.yearlyFee
        ),

      digital_discount:
        escapeHtml(
          amounts.digitalDiscount ||
          digitalModule.discount
        ),

      digital_amount:
        escapeHtml(digitalAmount),

      digital_gst:
        escapeHtml(
          amounts.digitalGst ||
          digitalModule.gst
        ),

      commission_without_erp:
        escapeHtml(
          amounts.commissionWithoutErp ||
          admissionModule.commissionWithoutErp
        ),

      commission_with_erp:
        escapeHtml(
          amounts.commissionWithErp ||
          admissionModule.commissionWithErp
        ),

    }
  );
}


// ============================================================================
// BUILD ERP AGREEMENT
// ============================================================================

export function buildErpAgreementHtml(
  selectedServices = {},
  amounts = {},
  lead = {},
  agreementData = {},
) {

  const erpModule =
    SERVICE_MODULES.erp;

  const planKey =
    amounts.erpPlan ||
    "erpPro";

  const plan =
    erpModule.plans[planKey] ||
    erpModule.plans.erpPro;

  const erpAmount =
    agreementData?.erpPrice ||
    agreementData?.manualPrice ||
    amounts.erpAmount ||
    plan.defaultAmount;

  const erpTotalStrength =
    agreementData?.studentStrength ||
    agreementData?.totalStrength ||
    amounts.erpTotalStrength ||
    "";

  const gst =
    amounts.erpGst ||
    "Exclusive of GST";

  const total =
    amounts.erpTotalAmount ||
    erpAmount;

  return replacePlaceholders(
    ERP_TEMPLATE_HTML,
    {

      agreement_date:
        escapeHtml(
          formatDate(
            agreementData.date ||
            agreementData.agreementDate ||
            new Date()
          )
        ),

      client_name:
        escapeHtml(
          lead?.name ||
          lead?.school ||
          lead?.schoolName ||
          agreementData?.clientName ||
          ""
        ),

      client_address:
        escapeHtml(
          lead?.schoolAddress ||
          lead?.address ||
          agreementData?.clientAddress ||
          ""
        ),

      erp_plan_label:
        escapeHtml(plan.label),

      erp_amount:
        escapeHtml(erpAmount),

      erp_total_strength:
        escapeHtml(String(erpTotalStrength)),

      erp_gst:
        escapeHtml(gst),

      erp_total_amount:
        escapeHtml(total),

      company_signatory_name:
        escapeHtml(
          agreementData?.companySignatoryName ||
          "R. Aravind"
        ),

      company_signatory_title:
        escapeHtml(
          agreementData?.companySignatoryTitle ||
          "Chief Executive Officer"
        ),

      client_signatory_name:
        escapeHtml(
          agreementData?.clientSignatoryName ||
          ""
        ),

      client_signatory_title:
        escapeHtml(
          agreementData?.clientSignatoryTitle ||
          "Principal / Authorized Signatory"
        ),

    }
  );
}


// ============================================================================
// ADMISSION DASHBOARD ONLY
// ============================================================================
//
// The original Admission Dashboard agreement is represented using the
// original Digital Marketing branded agreement structure.
//
// We keep the original PDF branding, header, footer and clauses.
//

export function buildAdmissionDashboardAgreementHtml(
  selectedServices = {},
  amounts = {},
  lead = {},
  agreementData = {},
) {

  return buildDigitalMarketingAgreementHtml(
    {
      ...selectedServices,
      admissionDashboard: true,
    },

    {
      ...amounts,
      digitalMarketing:
        "NO DIGITAL MARKETING FEE",
    },

    lead,

    agreementData
  );
}


// ============================================================================
// MAIN BUILDER
// ============================================================================
//
// selectedServices:
//
// {
//   admissionDashboard: true,
//   digitalMarketing: false,
//   erp: true
// }
//
// IMPORTANT:
//
// ERP and Digital Marketing documents are NOT merged into one generic
// agreement.
//
// If both are selected:
//
// ERP ORIGINAL DOCUMENT
//        +
// PAGE BREAK
//        +
// DIGITAL MARKETING ORIGINAL DOCUMENT
//
// ============================================================================

export function buildAgreementHtml(
  selectedServices = {},
  amounts = {},
  lead = {},
  agreementData = {},
) {

  const selected = {

    admissionDashboard:
      Boolean(
        selectedServices?.admissionDashboard
      ),

    digitalMarketing:
      Boolean(
        selectedServices?.digitalMarketing
      ),

    erp:
      Boolean(
        selectedServices?.erp
      ),

  };


  // ------------------------------------------------------------
  // VALIDATION
  // ------------------------------------------------------------

  if (
    !selected.admissionDashboard &&
    !selected.digitalMarketing &&
    !selected.erp
  ) {
    throw new Error(
      "Please select at least one agreement service."
    );
  }


  const documents = [];


  // ------------------------------------------------------------
  // ERP ORIGINAL AGREEMENT
  // ------------------------------------------------------------

  if (selected.erp) {

    documents.push(
      buildErpAgreementHtml(
        selectedServices,
        amounts,
        lead,
        agreementData
      )
    );

  }


  // ------------------------------------------------------------
  // DIGITAL MARKETING ORIGINAL AGREEMENT
  // ------------------------------------------------------------

  if (selected.digitalMarketing) {

    documents.push(
      buildDigitalMarketingAgreementHtml(
        selectedServices,
        amounts,
        lead,
        agreementData
      )
    );

  }


  // ------------------------------------------------------------
  // ADMISSION DASHBOARD ONLY
  // ------------------------------------------------------------

  if (
    selected.admissionDashboard &&
    !selected.digitalMarketing
  ) {

    documents.push(
      buildAdmissionDashboardAgreementHtml(
        selectedServices,
        amounts,
        lead,
        agreementData
      )
    );

  }


  // ------------------------------------------------------------
  // RETURN ALL SELECTED ORIGINAL DOCUMENTS
  // ------------------------------------------------------------

  return documents.join(`
    <div
      style="
        page-break-before: always;
        break-before: page;
        height: 0;
      "
    ></div>
  `);

}


// ============================================================================
// TEMPLATE REGISTRY
// ============================================================================

export const AGREEMENT_TEMPLATES = {

  erp: {
    key: "erp",

    label: "ERP Software Agreement",

    build: buildErpAgreementHtml,
  },


  digitalMarketing: {
    key: "digitalMarketing",

    label:
      "Digital Marketing & Admin Dashboard Agreement",

    build:
      buildDigitalMarketingAgreementHtml,
  },


  admissionDashboard: {
    key: "admissionDashboard",

    label:
      "Admission Dashboard Agreement",

    build:
      buildAdmissionDashboardAgreementHtml,
  },

};


// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default {

  COMPANY,

  INDOCAMPAS_LOGO_SRC,

  SERVICE_MODULES,

  ERP_TEMPLATE_HTML,

  DIGITAL_MARKETING_TEMPLATE_HTML,

  AGREEMENT_TEMPLATES,

  buildAgreementHtml,

  buildErpAgreementHtml,

  buildDigitalMarketingAgreementHtml,

  buildAdmissionDashboardAgreementHtml,

};


