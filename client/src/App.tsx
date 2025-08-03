
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { PlusIcon, EditIcon, TrashIcon, FileTextIcon, DownloadIcon, CalendarIcon, MapPinIcon, UserIcon, ClipboardCheckIcon } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import type { TaskLetter, CreateTaskLetterInput, UpdateTaskLetterInput, UpdateOfficialDetailsInput } from '../../server/src/schema';

function App() {
  const [taskLetters, setTaskLetters] = useState<TaskLetter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<TaskLetter | null>(null);
  const [activeTab, setActiveTab] = useState<string>('list');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isOfficialDialogOpen, setIsOfficialDialogOpen] = useState(false);

  // Form states
  const [createFormData, setCreateFormData] = useState<CreateTaskLetterInput>({
    register_number: '',
    title: '',
    recipient_name: '',
    recipient_position: '',
    destination_place: '',
    purpose: '',
    start_date: new Date(),
    end_date: new Date(),
    transportation: '',
    advance_money: 0,
    signatory_name: '',
    signatory_position: '',
    creation_place: '',
    creation_date: new Date()
  });

  const [editFormData, setEditFormData] = useState<Partial<UpdateTaskLetterInput>>({});
  const [officialFormData, setOfficialFormData] = useState<Omit<UpdateOfficialDetailsInput, 'id'>>({
    arrival_date: null,
    return_date: null,
    ticket_taken: null,
    official_notes: null
  });

  const loadTaskLetters = useCallback(async () => {
    try {
      const result = await trpc.getTaskLetters.query();
      setTaskLetters(result);
    } catch (error) {
      console.error('Failed to load task letters:', error);
    }
  }, []);

  useEffect(() => {
    loadTaskLetters();
  }, [loadTaskLetters]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createTaskLetter.mutate(createFormData);
      setTaskLetters((prev: TaskLetter[]) => [response, ...prev]);
      setCreateFormData({
        register_number: '',
        title: '',
        recipient_name: '',
        recipient_position: '',
        destination_place: '',
        purpose: '',
        start_date: new Date(),
        end_date: new Date(),
        transportation: '',
        advance_money: 0,
        signatory_name: '',
        signatory_position: '',
        creation_place: '',
        creation_date: new Date()
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create task letter:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLetter) return;
    
    setIsLoading(true);
    try {
      const response = await trpc.updateTaskLetter.mutate({
        id: selectedLetter.id,
        ...editFormData
      });
      setTaskLetters((prev: TaskLetter[]) => 
        prev.map((letter: TaskLetter) => letter.id === response.id ? response : letter)
      );
      setIsEditDialogOpen(false);
      setSelectedLetter(null);
      setEditFormData({});
    } catch (error) {
      console.error('Failed to update task letter:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOfficialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLetter) return;
    
    setIsLoading(true);
    try {
      const response = await trpc.updateOfficialDetails.mutate({
        id: selectedLetter.id,
        ...officialFormData
      });
      setTaskLetters((prev: TaskLetter[]) => 
        prev.map((letter: TaskLetter) => letter.id === response.id ? response : letter)
      );
      setIsOfficialDialogOpen(false);
      setSelectedLetter(null);
      setOfficialFormData({
        arrival_date: null,
        return_date: null,
        ticket_taken: null,
        official_notes: null
      });
    } catch (error) {
      console.error('Failed to update official details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteTaskLetter.mutate({ id });
      setTaskLetters((prev: TaskLetter[]) => 
        prev.filter((letter: TaskLetter) => letter.id !== id)
      );
    } catch (error) {
      console.error('Failed to delete task letter:', error);
    }
  };

  const handleExport = async (id: number, format: 'pdf' | 'docx') => {
    try {
      const response = await trpc.exportDocument.mutate({ id, format });
      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = response.fileUrl;
      link.download = response.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to export document:', error);
    }
  };

  const openEditDialog = (letter: TaskLetter) => {
    setSelectedLetter(letter);
    setEditFormData({
      register_number: letter.register_number,
      title: letter.title,
      recipient_name: letter.recipient_name,
      recipient_position: letter.recipient_position,
      destination_place: letter.destination_place,
      purpose: letter.purpose,
      start_date: letter.start_date,
      end_date: letter.end_date,
      transportation: letter.transportation,
      advance_money: letter.advance_money,
      signatory_name: letter.signatory_name,
      signatory_position: letter.signatory_position,
      creation_place: letter.creation_place,
      creation_date: letter.creation_date
    });
    setIsEditDialogOpen(true);
  };

  const openOfficialDialog = (letter: TaskLetter) => {
    setSelectedLetter(letter);
    setOfficialFormData({
      arrival_date: letter.arrival_date,
      return_date: letter.return_date,
      ticket_taken: letter.ticket_taken,
      official_notes: letter.official_notes
    });
    setIsOfficialDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return format(date, 'dd MMMM yyyy', { locale: id });
  };

  const getStatusBadge = (letter: TaskLetter) => {
    const now = new Date();
    const isCompleted = letter.arrival_date && letter.return_date;
    const isOngoing = now >= letter.start_date && now <= letter.end_date && !isCompleted;
    const isPending = now < letter.start_date;
    
    if (isCompleted) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Selesai</Badge>;
    } else if (isOngoing) {
      return <Badge variant="default" className="bg-blue-100 text-blue-800">Berlangsung</Badge>;
    } else if (isPending) {
      return <Badge variant="secondary">Menunggu</Badge>;
    } else {
      return <Badge variant="destructive">Terlambat</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📋 Manajemen Surat Tugas</h1>
              <p className="text-gray-600 mt-1">Kelola dokumen surat tugas dengan mudah dan efisien</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Buat Surat Tugas
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>📝 Buat Surat Tugas Baru</DialogTitle>
                  <DialogDescription>
                    Lengkapi informasi surat tugas dengan teliti
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="register_number">Nomor Register</Label>
                      <Input
                        id="register_number"
                        value={createFormData.register_number}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCreateFormData((prev: CreateTaskLetterInput) => ({ ...prev, register_number: e.target.value }))
                        }
                        placeholder="ST/001/2024"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="title">Judul Surat</Label>
                      <Input
                        id="title"
                        value={createFormData.title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCreateFormData((prev: CreateTaskLetterInput) => ({ ...prev, title: e.target.value }))
                        }
                        placeholder="Surat Tugas Perjalanan Dinas"
                        required
                      />
                    </div>
                  </div>

                  <Separator />
                  <h4 className="font-semibold text-gray-900">👤 Informasi Penerima Tugas</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="recipient_name">Nama Penerima</Label>
                      <Input
                        id="recipient_name"
                        value={createFormData.recipient_name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCreateFormData((prev: CreateTaskLetterInput) => ({ ...prev, recipient_name: e.target.value }))
                        }
                        placeholder="Nama lengkap"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="recipient_position">Jabatan</Label>
                      <Input
                        id="recipient_position"
                        value={createFormData.recipient_position}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCreateFormData((prev: CreateTaskLetterInput) => ({ ...prev, recipient_position: e.target.value }))
                        }
                        placeholder="Jabatan/posisi"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="destination_place">Tempat Tujuan</Label>
                    <Input
                      id="destination_place"
                      value={createFormData.destination_place}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCreateFormData((prev: CreateTaskLetterInput) => ({ ...prev, destination_place: e.target.value }))
                      }
                      placeholder="Kota/lokasi tujuan"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="purpose">Keperluan/Maksud Perjalanan</Label>
                    <Textarea
                      id="purpose"
                      value={createFormData.purpose}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setCreateFormData((prev: CreateTaskLetterInput) => ({ ...prev, purpose: e.target.value }))
                      }
                      placeholder="Jelaskan tujuan dan keperluan perjalanan dinas"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_date">Tanggal Mulai</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={createFormData.start_date instanceof Date ? createFormData.start_date.toISOString().split('T')[0] : ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCreateFormData((prev: CreateTaskLetterInput) => ({ ...prev, start_date: new Date(e.target.value) }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_date">Tanggal Berakhir</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={createFormData.end_date instanceof Date ? createFormData.end_date.toISOString().split('T')[0] : ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCreateFormData((prev: CreateTaskLetterInput) => ({ ...prev, end_date: new Date(e.target.value) }))
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="transportation">Alat Transportasi</Label>
                      <Select 
                        value={createFormData.transportation}
                        onValueChange={(value: string) =>
                          setCreateFormData((prev: CreateTaskLetterInput) => ({ ...prev, transportation: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih transportasi" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Kendaraan Dinas">🚗 Kendaraan Dinas</SelectItem>
                          <SelectItem value="Kendaraan Pribadi">🚙 Kendaraan Pribadi</SelectItem>
                          <SelectItem value="Pesawat">✈️ Pesawat</SelectItem>
                          <SelectItem value="Kereta Api">🚄 Kereta Api</SelectItem>
                          <SelectItem value="Bus">🚌 Bus</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="advance_money">Uang Muka</Label>
                      <Input
                        id="advance_money"
                        type="number"
                        value={createFormData.advance_money}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCreateFormData((prev: CreateTaskLetterInput) => ({ ...prev, advance_money: parseFloat(e.target.value) || 0 }))
                        }
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>

                  <Separator />
                  <h4 className="font-semibold text-gray-900">✍️ Informasi Penandatangan</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="signatory_name">Nama Penandatangan</Label>
                      <Input
                        id="signatory_name"
                        value={createFormData.signatory_name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCreateFormData((prev: CreateTaskLetterInput) => ({ ...prev, signatory_name: e.target.value }))
                        }
                        placeholder="Nama pejabat penandatangan"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="signatory_position">Jabatan Penandatangan</Label>
                      <Input
                        id="signatory_position"
                        value={createFormData.signatory_position}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCreateFormData((prev: CreateTaskLetterInput) => ({ ...prev, signatory_position: e.target.value }))
                        }
                        placeholder="Jabatan pejabat"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="creation_place">Tempat Pembuatan</Label>
                      <Input
                        id="creation_place"
                        value={createFormData.creation_place}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCreateFormData((prev: CreateTaskLetterInput) => ({ ...prev, creation_place: e.target.value }))
                        }
                        placeholder="Kota/tempat dibuat"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="creation_date">Tanggal Pembuatan</Label>
                      <Input
                        id="creation_date"
                        type="date"
                        value={createFormData.creation_date instanceof Date ? createFormData.creation_date.toISOString().split('T')[0] : ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCreateFormData((prev: CreateTaskLetterInput) => ({ ...prev, creation_date: new Date(e.target.value) }))
                        }
                        required
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                      {isLoading ? 'Menyimpan...' : 'Simpan Surat Tugas'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="list">📋 Daftar Surat Tugas</TabsTrigger>
            <TabsTrigger value="cards">🗂️ Tampilan Kartu</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            {taskLetters.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent className="pt-6">
                  <FileTextIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Surat Tugas</h3>
                  <p className="text-gray-600 mb-4">
                    Mulai dengan membuat surat tugas pertama Anda
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Buat Surat Tugas
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>📊 Daftar Surat Tugas ({taskLetters.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No. Register</TableHead>
                        <TableHead>Penerima</TableHead>
                        <TableHead>Tujuan</TableHead>
                        <TableHead>Periode</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {taskLetters.map((letter: TaskLetter) => (
                        <TableRow key={letter.id}>
                          <TableCell className="font-medium">{letter.register_number}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{letter.recipient_name}</div>
                              <div className="text-sm text-gray-500">{letter.recipient_position}</div>
                            </div>
                          </TableCell>
                          <TableCell>{letter.destination_place}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{formatDate(letter.start_date)}</div>
                              <div className="text-gray-500">s/d {formatDate(letter.end_date)}</div>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(letter)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(letter)}
                              >
                                <EditIcon className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openOfficialDialog(letter)}
                              >
                                <ClipboardCheckIcon className="w-4 h-4" />
                              </Button>
                              <Select onValueChange={(format: 'pdf' | 'docx') => handleExport(letter.id, format)}>
                                <SelectTrigger className="w-auto">
                                  <DownloadIcon className="w-4 h-4" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pdf">📄 Export PDF</SelectItem>
                                  <SelectItem value="docx">📝 Export DOCX</SelectItem>
                                </SelectContent>
                              </Select>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                    <TrashIcon className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Hapus Surat Tugas?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tindakan ini tidak dapat dibatalkan. Surat tugas {letter.register_number} akan dihapus secara permanen.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(letter.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Hapus
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="cards" className="space-y-4">
            {taskLetters.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent className="pt-6">
                  <FileTextIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Surat Tugas</h3>
                  <p className="text-gray-600 mb-4">
                    Mulai dengan membuat surat tugas pertama Anda
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Buat Surat Tugas
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {taskLetters.map((letter: TaskLetter) => (
                  <Card key={letter.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{letter.register_number}</CardTitle>
                          <CardDescription className="mt-1">{letter.title}</CardDescription>
                        </div>
                        {getStatusBadge(letter)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <UserIcon className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="font-medium">{letter.recipient_name}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPinIcon className="w-4 h-4 mr-2 text-gray-400" />
                          <span>{letter.destination_place}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
                          <span>{formatDate(letter.start_date)} - {formatDate(letter.end_date)}</span>
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {letter.purpose}
                        </p>
                      </div>
                      
                      {letter.advance_money > 0 && (
                        <div className="text-sm">
                          <span className="text-gray-500">Uang Muka: </span>
                          <span className="font-medium text-green-600">{formatCurrency(letter.advance_money)}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(letter)}
                          >
                            <EditIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openOfficialDialog(letter)}
                          >
                            <ClipboardCheckIcon className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select onValueChange={(format: 'pdf' | 'docx') => handleExport(letter.id, format)}>
                            <SelectTrigger className="w-auto">
                              <DownloadIcon className="w-4 h-4" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pdf">📄 PDF</SelectItem>
                              <SelectItem value="docx">📝 DOCX</SelectItem>
                            </SelectContent>
                          </Select>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                <TrashIcon className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hap Surat Tugas?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tindakan ini tidak dapat dibatalkan. Surat tugas {letter.register_number} akan dihapus secara permanen.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(letter.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Hapu
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>✏️ Edit Surat Tugas</DialogTitle>
              <DialogDescription>
                Perbarui informasi surat tugas
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_register_number">Nomor Register</Label>
                  <Input
                    id="edit_register_number"
                    value={editFormData.register_number || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: Partial<UpdateTaskLetterInput>) => ({ ...prev, register_number: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit_title">Judul Surat</Label>
                  <Input
                    id="edit_title"
                    value={editFormData.title || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: Partial<UpdateTaskLetterInput>) => ({ ...prev, title: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_recipient_name">Nama Penerima</Label>
                  <Input
                    id="edit_recipient_name"
                    value={editFormData.recipient_name || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: Partial<UpdateTaskLetterInput>) => ({ ...prev, recipient_name: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit_recipient_position">Jabatan</Label>
                  <Input
                    id="edit_recipient_position"
                    value={editFormData.recipient_position || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: Partial<UpdateTaskLetterInput>) => ({ ...prev, recipient_position: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit_destination_place">Tempat Tujuan</Label>
                <Input
                  id="edit_destination_place"
                  value={editFormData.destination_place || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: Partial<UpdateTaskLetterInput>) => ({ ...prev, destination_place: e.target.value }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="edit_purpose">Keperluan</Label>
                <Textarea
                  id="edit_purpose"
                  value={editFormData.purpose || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEditFormData((prev: Partial<UpdateTaskLetterInput>) => ({ ...prev, purpose: e.target.value }))
                  }
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                  {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Official Details Dialog */}
        <Dialog open={isOfficialDialogOpen} onOpenChange={setIsOfficialDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>📋 Detail Resmi Perjalanan</DialogTitle>
              <DialogDescription>
                Lengkapi informasi untuk pejabat di tempat tujuan
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleOfficialSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="arrival_date">Tanggal Tiba</Label>
                  <Input
                    id="arrival_date"
                    type="date"
                    value={officialFormData.arrival_date instanceof Date ? officialFormData.arrival_date.toISOString().split('T')[0] : ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setOfficialFormData((prev: Omit<UpdateOfficialDetailsInput, 'id'>) => ({ 
                        ...prev, 
                        arrival_date: e.target.value ? new Date(e.target.value) : null 
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="return_date">Tanggal Kembali</Label>
                  <Input
                    id="return_date"
                    type="date"
                    value={officialFormData.return_date instanceof Date ? officialFormData.return_date.toISOString().split('T')[0] : ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setOfficialFormData((prev: Omit<UpdateOfficialDetailsInput, 'id'>) => ({ 
                        ...prev, 
                        return_date: e.target.value ? new Date(e.target.value) : null 
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="ticket_taken">Status Pengambilan Tiket</Label>
                <Select 
                  value={officialFormData.ticket_taken === null ? '' : officialFormData.ticket_taken.toString()}
                  onValueChange={(value: string) =>
                    setOfficialFormData((prev: Omit<UpdateOfficialDetailsInput, 'id'>) => ({ 
                      ...prev, 
                      ticket_taken: value === '' ? null : value === 'true'
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status tiket" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">✅ Tiket Diambil</SelectItem>
                    <SelectItem value="false">❌ Tiket Tidak Diambil</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="official_notes">Catatan Resmi</Label>
                <Textarea
                  id="official_notes"
                  value={officialFormData.official_notes || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setOfficialFormData((prev: Omit<UpdateOfficialDetailsInput, 'id'>) => ({ 
                      ...prev, 
                      official_notes: e.target.value || null 
                    }))
                  }
                  placeholder="Catatan tambahan dari pejabat di tempat tujuan"
                  rows={4}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOfficialDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                  {isLoading ? 'Menyimpan...' : 'Simpan Detail'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default App;
