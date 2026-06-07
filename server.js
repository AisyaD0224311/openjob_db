require('dotenv').config();
const pool = require('./database');
const express = require('express');
const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');

// Services
const userService = require('./services/UserServices');
const authService = require('./services/AuthServices');
const companyService = require('./services/CompanyServices');
const categoryService = require('./services/CategoryServices');
const jobService = require('./services/JobServices');
const applicationService = require('./services/ApplicationServices');
const bookmarkService = require('./services/BookmarkServices');
const documentService = require('./services/DocumentServices');

// Validators
const { UserPayloadSchema } = require('./validator/UserValidator');
const { AuthPayloadSchema } = require('./validator/AuthValidator');
const { CompanyPayloadSchema } = require('./validator/CompanyValidator');
const { CategoryPayloadSchema } = require('./validator/CategoryValidator');
const { JobPayloadSchema } = require('./validator/JobValidator');
const { ApplicationPayloadSchema, ApplicationStatusSchema } = require('./validator/ApplicationValidator');

// Middleware
const validationMiddleware = require('./middleware/ValidationMiddleware');
const authMiddleware = require('./middleware/AuthMiddleware');
const upload = require('./middleware/UploadMiddleware');

const app = express();
app.use(express.json());

// ─────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────

// POST /users – Register
app.post('/users', validationMiddleware(UserPayloadSchema), async (req, res, next) => {
  try {
    const userId = await userService.addUser(req.body);
    res.status(201).json({
      status: 'success',
      message: 'User berhasil ditambahkan',
      data: { userId },
    });
  } catch (error) {
    next(error);
  }
});

// GET /users/:id – Get user by ID (public)
app.get('/users/:id', async (req, res, next) => {
  try {
    const query = {
      text: 'SELECT id, username, fullname, email FROM users WHERE id = $1',
      values: [req.params.id],
    };
    const result = await pool.query(query);
    if (!result.rowCount) {
      const error = new Error('User tidak ditemukan');
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({ status: 'success', data: { user: result.rows[0] } });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────
// AUTHENTICATIONS
// ─────────────────────────────────────────────

// POST /authentications – Login
app.post('/authentications', validationMiddleware(AuthPayloadSchema), async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const userId = await userService.verifyUserCredential(username, password);

    const accessToken = jwt.sign({ id: userId }, process.env.ACCESS_TOKEN_KEY, { expiresIn: '3h' });
    const refreshToken = jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_KEY);

    await authService.addRefreshToken(refreshToken);

    res.status(201).json({ status: 'success', data: { accessToken, refreshToken } });
  } catch (error) {
    next(error);
  }
});

// PUT /authentications – Refresh token
app.put('/authentications', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      const error = new Error('Refresh token tidak ada');
      error.statusCode = 400;
      throw error;
    }

    const checkToken = await pool.query('SELECT token FROM authentications WHERE token = $1', [refreshToken]);
    if (checkToken.rows.length === 0) {
      const error = new Error('Refresh token tidak valid');
      error.statusCode = 400;
      throw error;
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_KEY);
    const newAccessToken = jwt.sign({ id: decoded.id }, process.env.ACCESS_TOKEN_KEY, { expiresIn: '3h' });

    res.status(200).json({ status: 'success', data: { accessToken: newAccessToken } });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(400).json({ status: 'fail', message: 'Refresh token tidak valid' });
    }
    next(error);
  }
});

// DELETE /authentications – Logout
app.delete('/authentications', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    await pool.query('DELETE FROM authentications WHERE token = $1', [refreshToken]);
    res.status(200).json({ status: 'success', message: 'Logout berhasil' });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────
// COMPANIES
// ─────────────────────────────────────────────

// GET /companies – List all (public)
app.get('/companies', async (req, res, next) => {
  try {
    const companies = await companyService.getAllCompanies();
    res.status(200).json({ status: 'success', data: { companies } });
  } catch (error) {
    next(error);
  }
});

// GET /companies/:id – Detail (public)
app.get('/companies/:id', async (req, res, next) => {
  try {
    const company = await companyService.getCompanyById(req.params.id);
    res.status(200).json({ status: 'success', data: { company } });
  } catch (error) {
    next(error);
  }
});

// POST /companies – Create (protected)
app.post('/companies', authMiddleware, validationMiddleware(CompanyPayloadSchema), async (req, res, next) => {
  try {
    const companyId = await companyService.addCompany(req.body);
    res.status(201).json({
      status: 'success',
      message: 'Company berhasil ditambahkan',
      data: { companyId },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /companies/:id – Update (protected)
app.put('/companies/:id', authMiddleware, validationMiddleware(CompanyPayloadSchema), async (req, res, next) => {
  try {
    await companyService.updateCompany(req.params.id, req.body);
    res.status(200).json({ status: 'success', message: 'Company berhasil diperbarui' });
  } catch (error) {
    next(error);
  }
});

// DELETE /companies/:id – Delete (protected)
app.delete('/companies/:id', authMiddleware, async (req, res, next) => {
  try {
    await companyService.deleteCompany(req.params.id);
    res.status(200).json({ status: 'success', message: 'Company berhasil dihapus' });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────

// GET /categories – List all (public)
app.get('/categories', async (req, res, next) => {
  try {
    const categories = await categoryService.getAllCategories();
    res.status(200).json({ status: 'success', data: { categories } });
  } catch (error) {
    next(error);
  }
});

// GET /categories/:id – Detail (public)
app.get('/categories/:id', async (req, res, next) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);
    res.status(200).json({ status: 'success', data: { category } });
  } catch (error) {
    next(error);
  }
});

// POST /categories – Create (protected)
app.post('/categories', authMiddleware, validationMiddleware(CategoryPayloadSchema), async (req, res, next) => {
  try {
    const categoryId = await categoryService.addCategory(req.body);
    res.status(201).json({
      status: 'success',
      message: 'Kategori berhasil ditambahkan',
      data: { categoryId },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /categories/:id – Update (protected)
app.put('/categories/:id', authMiddleware, validationMiddleware(CategoryPayloadSchema), async (req, res, next) => {
  try {
    await categoryService.updateCategory(req.params.id, req.body);
    res.status(200).json({ status: 'success', message: 'Kategori berhasil diperbarui' });
  } catch (error) {
    next(error);
  }
});

// DELETE /categories/:id – Delete (protected)
app.delete('/categories/:id', authMiddleware, async (req, res, next) => {
  try {
    await categoryService.deleteCategory(req.params.id);
    res.status(200).json({ status: 'success', message: 'Kategori berhasil dihapus' });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────
// JOBS
// ─────────────────────────────────────────────

// GET /jobs – List all with optional search (public)
app.get('/jobs', async (req, res, next) => {
  try {
    const { title, 'company-name': companyName } = req.query;
    const jobs = await jobService.getAllJobs({ title, companyName });
    res.status(200).json({ status: 'success', data: { jobs } });
  } catch (error) {
    next(error);
  }
});

// GET /jobs/company/:companyId – Jobs by company (public)
// NOTE: must be defined BEFORE /jobs/:id to avoid conflict
app.get('/jobs/company/:companyId', async (req, res, next) => {
  try {
    const jobs = await jobService.getJobsByCompany(req.params.companyId);
    res.status(200).json({ status: 'success', data: { jobs } });
  } catch (error) {
    next(error);
  }
});

// GET /jobs/category/:categoryId – Jobs by category (public)
app.get('/jobs/category/:categoryId', async (req, res, next) => {
  try {
    const jobs = await jobService.getJobsByCategory(req.params.categoryId);
    res.status(200).json({ status: 'success', data: { jobs } });
  } catch (error) {
    next(error);
  }
});

// GET /jobs/:id – Detail (public)
app.get('/jobs/:id', async (req, res, next) => {
  try {
    const job = await jobService.getJobById(req.params.id);
    res.status(200).json({ status: 'success', data: { job } });
  } catch (error) {
    next(error);
  }
});

// POST /jobs – Create (protected)
app.post('/jobs', authMiddleware, validationMiddleware(JobPayloadSchema), async (req, res, next) => {
  try {
    const jobId = await jobService.addJob(req.body);
    res.status(201).json({
      status: 'success',
      message: 'Job berhasil ditambahkan',
      data: { jobId },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /jobs/:id – Update (protected)
app.put('/jobs/:id', authMiddleware, validationMiddleware(JobPayloadSchema), async (req, res, next) => {
  try {
    await jobService.updateJob(req.params.id, req.body);
    res.status(200).json({ status: 'success', message: 'Job berhasil diperbarui' });
  } catch (error) {
    next(error);
  }
});

// DELETE /jobs/:id – Delete (protected)
app.delete('/jobs/:id', authMiddleware, async (req, res, next) => {
  try {
    await jobService.deleteJob(req.params.id);
    res.status(200).json({ status: 'success', message: 'Job berhasil dihapus' });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────
// APPLICATIONS (all protected)
// ─────────────────────────────────────────────

// POST /applications – Apply for a job
app.post('/applications', authMiddleware, validationMiddleware(ApplicationPayloadSchema), async (req, res, next) => {
  try {
    const { job_id } = req.body;
    const applicationId = await applicationService.addApplication({ user_id: req.user.id, job_id });
    res.status(201).json({
      status: 'success',
      message: 'Lamaran berhasil dikirim',
      data: { applicationId },
    });
  } catch (error) {
    next(error);
  }
});

// GET /applications – List all applications
app.get('/applications', authMiddleware, async (req, res, next) => {
  try {
    const applications = await applicationService.getAllApplications();
    res.status(200).json({ status: 'success', data: { applications } });
  } catch (error) {
    next(error);
  }
});

// GET /applications/user/:userId – Applications by user
app.get('/applications/user/:userId', authMiddleware, async (req, res, next) => {
  try {
    const applications = await applicationService.getApplicationsByUser(req.params.userId);
    res.status(200).json({ status: 'success', data: { applications } });
  } catch (error) {
    next(error);
  }
});

// GET /applications/job/:jobId – Applications by job
app.get('/applications/job/:jobId', authMiddleware, async (req, res, next) => {
  try {
    const applications = await applicationService.getApplicationsByJob(req.params.jobId);
    res.status(200).json({ status: 'success', data: { applications } });
  } catch (error) {
    next(error);
  }
});

// GET /applications/:id – Get application detail
app.get('/applications/:id', authMiddleware, async (req, res, next) => {
  try {
    const application = await applicationService.getApplicationById(req.params.id);
    res.status(200).json({ status: 'success', data: { application } });
  } catch (error) {
    next(error);
  }
});

// PUT /applications/:id – Update application status
app.put('/applications/:id', authMiddleware, validationMiddleware(ApplicationStatusSchema), async (req, res, next) => {
  try {
    await applicationService.updateApplicationStatus(req.params.id, req.body);
    res.status(200).json({ status: 'success', message: 'Status lamaran berhasil diperbarui' });
  } catch (error) {
    next(error);
  }
});

// DELETE /applications/:id – Delete application
app.delete('/applications/:id', authMiddleware, async (req, res, next) => {
  try {
    await applicationService.deleteApplication(req.params.id);
    res.status(200).json({ status: 'success', message: 'Lamaran berhasil dihapus' });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────
// BOOKMARKS (all protected)
// ─────────────────────────────────────────────

// POST /jobs/:jobId/bookmark – Create bookmark
app.post('/jobs/:jobId/bookmark', authMiddleware, async (req, res, next) => {
  try {
    const bookmarkId = await bookmarkService.addBookmark({
      user_id: req.user.id,
      job_id: req.params.jobId,
    });
    res.status(201).json({
      status: 'success',
      message: 'Job berhasil di-bookmark',
      data: { bookmarkId },
    });
  } catch (error) {
    next(error);
  }
});

// GET /jobs/:jobId/bookmark/:id – Get bookmark detail
app.get('/jobs/:jobId/bookmark/:id', authMiddleware, async (req, res, next) => {
  try {
    const bookmark = await bookmarkService.getBookmarkById(req.params.id);
    res.status(200).json({ status: 'success', data: { bookmark } });
  } catch (error) {
    next(error);
  }
});

// DELETE /jobs/:jobId/bookmark – Delete bookmark by user and job
app.delete('/jobs/:jobId/bookmark', authMiddleware, async (req, res, next) => {
  try {
    await bookmarkService.deleteBookmarkByUserAndJob(req.user.id, req.params.jobId);
    res.status(200).json({ status: 'success', message: 'Bookmark berhasil dihapus' });
  } catch (error) {
    next(error);
  }
});

// GET /bookmarks – Get all bookmarks for logged-in user
app.get('/bookmarks', authMiddleware, async (req, res, next) => {
  try {
    const bookmarks = await bookmarkService.getAllBookmarksByUser(req.user.id);
    res.status(200).json({ status: 'success', data: { bookmarks } });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────
// DOCUMENTS
// ─────────────────────────────────────────────

// GET /documents – Get all documents (public)
app.get('/documents', async (req, res, next) => {
  try {
    const documents = await documentService.getAllDocuments();
    res.status(200).json({ status: 'success', data: { documents } });
  } catch (error) {
    next(error);
  }
});

// GET /documents/:id – Get document by ID (public)
app.get('/documents/:id', async (req, res, next) => {
  try {
    const document = await documentService.getDocumentById(req.params.id);
    res.status(200).json({ status: 'success', data: { document } });
  } catch (error) {
    next(error);
  }
});

// POST /documents – Upload document (protected)
app.post('/documents', authMiddleware, upload.single('document'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ status: 'fail', message: 'File tidak ditemukan' });

    const id = `doc-${nanoid(16)}`;
    const userId = req.user.id;
    const filePath = req.file.path;

    await pool.query(
      'INSERT INTO user_cvs(id, user_id, file_path) VALUES($1, $2, $3)',
      [id, userId, filePath]
    );

    res.status(201).json({
      status: 'success',
      message: 'Document berhasil diunggah',
      data: { documentId: id },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /documents/:id – Delete document (protected)
app.delete('/documents/:id', authMiddleware, async (req, res, next) => {
  try {
    await documentService.deleteDocument(req.params.id, req.user.id);
    res.status(200).json({ status: 'success', message: 'Dokumen berhasil dihapus' });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────
// PROFILE (protected)
// ─────────────────────────────────────────────

// GET /profile – Get logged-in user profile
app.get('/profile', authMiddleware, async (req, res, next) => {
  try {
    const query = {
      text: 'SELECT id, username, fullname, email FROM users WHERE id = $1',
      values: [req.user.id],
    };
    const result = await pool.query(query);
    const user = result.rows[0];
    res.status(200).json({ status: 'success', data: { user } });
  } catch (error) {
    next(error);
  }
});

// GET /profile/applications – Get my applications
app.get('/profile/applications', authMiddleware, async (req, res, next) => {
  try {
    const applications = await applicationService.getApplicationsByUser(req.user.id);
    res.status(200).json({ status: 'success', data: { applications } });
  } catch (error) {
    next(error);
  }
});

// GET /profile/bookmarks – Get my bookmarks
app.get('/profile/bookmarks', authMiddleware, async (req, res, next) => {
  try {
    const bookmarks = await bookmarkService.getAllBookmarksByUser(req.user.id);
    res.status(200).json({ status: 'success', data: { bookmarks } });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────
// GLOBAL ERROR HANDLER
// ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Terjadi kegagalan pada server kami';
  res.status(statusCode).json({
    status: statusCode >= 500 ? 'error' : 'fail',
    message,
  });
});

const host = process.env.HOST || 'localhost';
const port = process.env.PORT || 5000;
app.listen(port, host, () => {
  console.log(`Server berjalan pada http://${host}:${port}`);
});
